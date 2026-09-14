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
`);

module.exports = db;
