const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// node:sqlite is Node's own built-in SQLite (no native compiler needed, unlike
// better-sqlite3) — available from Node 22.5+. It's marked "experimental" by
// Node (you'll see a one-line warning when the server starts) but is fully
// usable for an app like this.
const dbPath = path.join(__dirname, '..', 'vidyabandham.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'tet_subscriber', 'admin')),
    name TEXT NOT NULL,
    class_id TEXT REFERENCES classes(id),
    student_id TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    roll TEXT NOT NULL,
    class_id TEXT NOT NULL REFERENCES classes(id),
    parent_user_id TEXT REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS diary_entries (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id),
    who TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS homework (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id),
    subject TEXT NOT NULL,
    task TEXT NOT NULL,
    due TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    class_id TEXT NOT NULL REFERENCES classes(id),
    date TEXT NOT NULL,
    student_id TEXT NOT NULL REFERENCES students(id),
    present INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (class_id, date, student_id)
  );

  CREATE TABLE IF NOT EXISTS fees (
    student_id TEXT PRIMARY KEY REFERENCES students(id),
    class_id TEXT NOT NULL REFERENCES classes(id),
    term TEXT NOT NULL,
    amount INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    parent_marked_paid_at TEXT,
    paid_at TEXT
  );

  CREATE TABLE IF NOT EXISTS fee_history (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id),
    term TEXT NOT NULL,
    amount INTEGER NOT NULL,
    paid_on TEXT NOT NULL
  );

  -- Reference material for teachers (or parents) preparing for TET (Teacher
  -- Eligibility Test) — not tied to any one class, shared across the app.
  CREATE TABLE IF NOT EXISTS tet_questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option INTEGER NOT NULL CHECK (correct_option IN (1, 2, 3, 4)),
    source TEXT,
    year INTEGER,
    question_te TEXT,
    option_a_te TEXT,
    option_b_te TEXT,
    option_c_te TEXT,
    option_d_te TEXT
  );

  -- One row per completed Mock Test attempt, so a teacher or parent can see
  -- their own score history. Tied to the same login they already use for
  -- the rest of the app — no separate mock-test signup needed.
  CREATE TABLE IF NOT EXISTS tet_mock_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    year TEXT,
    subject TEXT,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score_percent INTEGER NOT NULL,
    taken_at TEXT NOT NULL
  );

  -- TET 2026 paywall: one row per Razorpay payment/subscription period for a
  -- 'tet_subscriber' user. A subscription is "active" when status = 'paid'
  -- and current_period_end is in the future (checked in application code,
  -- not via a stored generated column, since node:sqlite's date functions
  -- are limited) — renewal is manual (a fresh payment + new row), not
  -- auto-recurring billing.
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'failed')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    amount INTEGER NOT NULL,
    current_period_end TEXT,
    created_at TEXT NOT NULL
  );

  -- One row per site visit (a single beacon call the frontend fires once
  -- per app load, see track.js) — just enough to answer "how many hits this
  -- week/month" from the admin dashboard. No path/referrer tracking, on
  -- purpose: this is meant to be a simple curiosity number, not analytics.
  CREATE TABLE IF NOT EXISTS page_hits (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );
`);

// The `users.role` CHECK constraint originally only allowed 'teacher' and
// 'parent'. The CREATE TABLE above already lists 'tet_subscriber' too, but
// that only takes effect on a brand-new database — CREATE TABLE IF NOT
// EXISTS is a no-op on an existing install (e.g. the live Render database),
// and SQLite can't ALTER a CHECK constraint directly. The standard
// workaround: rename the old table, create a new one with the updated
// constraint, copy the data across, then drop the old table.
const usersTableRow = db.prepare(
  "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
).get();
if (usersTableRow && !usersTableRow.sql.includes('tet_subscriber')) {
  // Two other tables (students.parent_user_id, tet_mock_attempts.user_id)
  // hold a foreign key to users(id). By default SQLite's ALTER TABLE RENAME
  // rewrites those tables' FK text to point at "users_old" when we rename
  // users out of the way, leaving them pointing at a dropped table once
  // we're done. `legacy_alter_table` turns that rewriting off, so the other
  // tables' FK text stays literally "users" and transparently picks up the
  // freshly-created replacement table instead. `foreign_keys` is turned off
  // for the same statements so the rename/drop sequence itself isn't
  // blocked by FK enforcement mid-migration.
  db.exec('PRAGMA legacy_alter_table = ON');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    ALTER TABLE users RENAME TO users_old;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'tet_subscriber')),
      name TEXT NOT NULL,
      class_id TEXT REFERENCES classes(id),
      student_id TEXT
    );

    INSERT INTO users (id, email, password_hash, role, name, class_id, student_id)
      SELECT id, email, password_hash, role, name, class_id, student_id FROM users_old;

    DROP TABLE users_old;
  `);
  db.exec('PRAGMA legacy_alter_table = OFF');
  db.exec('PRAGMA foreign_keys = ON');
}

// `year` was added to tet_questions after the table already existed on some
// installs (an existing local vidyabandham.db file, for instance). SQLite's
// CREATE TABLE IF NOT EXISTS above is a no-op once the table exists, so make
// sure the column is there too — safe to run every startup.
const tetColumns = db.prepare("PRAGMA table_info(tet_questions)").all();
if (!tetColumns.some((c) => c.name === 'year')) {
  db.exec('ALTER TABLE tet_questions ADD COLUMN year INTEGER');
}
// Telugu translations were added later too (Child Development & Pedagogy,
// Mathematics, and Science & EVS only — English-subject questions test the
// English language itself, so they stay English-only, same as the real
// AP TET papers). Same safe-migration pattern as `year` above.
const tetTeColumns = db.prepare("PRAGMA table_info(tet_questions)").all();
for (const col of ['question_te', 'option_a_te', 'option_b_te', 'option_c_te', 'option_d_te']) {
  if (!tetTeColumns.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE tet_questions ADD COLUMN ${col} TEXT`);
  }
}

// `created_at` was added to `users` for the admin dashboard's "new signups
// this week/month" numbers, after the table already existed on some
// installs. Adding a plain nullable column doesn't need the rename/recreate
// dance a CHECK constraint change does — existing rows just get NULL,
// which the admin dashboard's queries already skip.
const userColumnsForCreatedAt = db.prepare("PRAGMA table_info(users)").all();
if (!userColumnsForCreatedAt.some((c) => c.name === 'created_at')) {
  db.exec('ALTER TABLE users ADD COLUMN created_at TEXT');
}

// Same CHECK-constraint problem as the tet_subscriber migration above, this
// time adding the 'admin' role (for the admin dashboard). Re-checked
// independently of that migration since a database that already has
// tet_subscriber (e.g. the live Render database) would otherwise never pick
// up this second change.
const usersTableRowForAdmin = db.prepare(
  "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
).get();
if (usersTableRowForAdmin && !usersTableRowForAdmin.sql.includes("'admin'")) {
  db.exec('PRAGMA legacy_alter_table = ON');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    ALTER TABLE users RENAME TO users_old;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'tet_subscriber', 'admin')),
      name TEXT NOT NULL,
      class_id TEXT REFERENCES classes(id),
      student_id TEXT,
      created_at TEXT
    );

    INSERT INTO users (id, email, password_hash, role, name, class_id, student_id, created_at)
      SELECT id, email, password_hash, role, name, class_id, student_id, created_at FROM users_old;

    DROP TABLE users_old;
  `);
  db.exec('PRAGMA legacy_alter_table = OFF');
  db.exec('PRAGMA foreign_keys = ON');
}

// `login_count` / `last_login_at` track how many times each account has
// signed in (mainly so the admin dashboard can show how much the demo
// teacher@vb / parent@vb accounts are actually being used). Plain nullable
// column adds, same safe pattern as `created_at` above — no CHECK
// constraint involved, so no rename/recreate needed.
const userColumnsForLogins = db.prepare("PRAGMA table_info(users)").all();
if (!userColumnsForLogins.some((c) => c.name === 'login_count')) {
  db.exec('ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0');
}
if (!userColumnsForLogins.some((c) => c.name === 'last_login_at')) {
  db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
}

// `failure_reason` records why a subscription attempt didn't end in a paid
// row — the checkout widget was closed without paying, the signature
// verification failed, or the Razorpay order couldn't even be created —
// so the admin dashboard can show *why* people are dropping off at
// checkout, not just that the row is 'failed'. Plain nullable column, same
// safe add-if-missing pattern as the others above.
const subscriptionColumns = db.prepare("PRAGMA table_info(subscriptions)").all();
if (!subscriptionColumns.some((c) => c.name === 'failure_reason')) {
  db.exec('ALTER TABLE subscriptions ADD COLUMN failure_reason TEXT');
}

module.exports = db;
