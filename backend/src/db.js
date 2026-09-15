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
    role TEXT NOT NULL CHECK (role IN ('teacher', 'parent')),
    name TEXT NOT NULL,
    class_id TEXT REFERENCES classes(id),
    student_id TEXT
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
`);

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

module.exports = db;
