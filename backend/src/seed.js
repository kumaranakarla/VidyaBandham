// Resets the database to a known demo state: one class, one teacher login,
// one parent login, four students, and a little sample data.
//
// Two ways this runs:
//   1. Manually, from a terminal: `npm run seed` (see the bottom of this file).
//   2. Automatically, on server startup, if the database is empty — see
//      `seedIfEmpty()`, called from server.js. This matters on free hosts
//      like Render, whose free tier wipes the database file on every
//      sleep/restart: without this, the server would come back up with an
//      empty database and no way to log in, and nobody could run `npm run
//      seed` by hand on a server they don't have a terminal into.

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function seed() {
  db.exec(`
    DELETE FROM fee_history;
    DELETE FROM fees;
    DELETE FROM attendance;
    DELETE FROM homework;
    DELETE FROM diary_entries;
    DELETE FROM students;
    DELETE FROM users;
    DELETE FROM classes;
  `);

  const classId = 'class-6b';
  db.prepare('INSERT INTO classes (id, name) VALUES (?, ?)').run(classId, 'Class 6-B');

  const teacherId = id();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, class_id, student_id) VALUES (?, ?, ?, ?, ?, ?, NULL)'
  ).run(teacherId, 'teacher@vidyabandham.local', bcrypt.hashSync('teacher123', 10), 'teacher', 'Ms. Anjali Rao', classId);

  const students = [
    { name: 'Aarav Mehta', roll: '07' },
    { name: 'Diya Kulkarni', roll: '08' },
    { name: 'Ishaan Verma', roll: '09' },
    { name: 'Meher Kaur', roll: '10' },
  ];

  const studentIds = {};
  for (const s of students) {
    const sid = id();
    studentIds[s.name] = sid;
    db.prepare('INSERT INTO students (id, name, roll, class_id, parent_user_id) VALUES (?, ?, ?, ?, NULL)').run(
      sid,
      s.name,
      s.roll,
      classId
    );
  }

  // One parent login, linked to Aarav, so there's something to sign in with on day one.
  const parentId = id();
  const aaravId = studentIds['Aarav Mehta'];
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, class_id, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(parentId, 'parent@vidyabandham.local', bcrypt.hashSync('parent123', 10), 'parent', "Aarav's Parent", classId, aaravId);
  db.prepare('UPDATE students SET parent_user_id = ? WHERE id = ?').run(parentId, aaravId);

  db.prepare('INSERT INTO diary_entries (id, class_id, who, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id(),
    classId,
    'Ms. Anjali Rao',
    'PTM this Saturday, 20 Sep at 10 AM. Please bring the last unit test copy along.',
    now()
  );

  db.prepare('INSERT INTO homework (id, class_id, subject, task, due, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id(),
    classId,
    'Mathematics',
    'Exercise 4.2, questions 1-10',
    'Due tomorrow',
    now()
  );

  db.prepare(
    'INSERT INTO fees (student_id, class_id, term, amount, due_date, paid, parent_marked_paid_at, paid_at) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)'
  ).run(aaravId, classId, 'Term 2', 18500, '30 Sep');

  console.log('Seed complete.');
  console.log('Teacher login:  teacher@vidyabandham.local / teacher123');
  console.log('Parent login:   parent@vidyabandham.local / parent123  (linked to Aarav Mehta)');
}

// Only seeds if the database has no class yet — safe to call on every server
// startup without wiping data someone's actually added (e.g. on your own
// computer, where the file persists between restarts).
function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM classes').get();
  if (row.count === 0) {
    console.log('Database is empty — seeding demo data...');
    seed();
  }
}

module.exports = { seed, seedIfEmpty };

// Allows `npm run seed` / `node src/seed.js` to still work exactly as before,
// always resetting to fresh demo data regardless of what's already there.
if (require.main === module) {
  seed();
}
