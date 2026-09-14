// Resets the database to a known demo state: one class, one teacher login,
// one parent login, three students, and a little sample data.
// Run with: npm run seed

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

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
).run(teacherId, 'teacher@sampark.local', bcrypt.hashSync('teacher123', 10), 'teacher', 'Ms. Anjali Rao', classId);

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
).run(parentId, 'parent@sampark.local', bcrypt.hashSync('parent123', 10), 'parent', "Aarav's Parent", classId, aaravId);
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
console.log('Teacher login:  teacher@sampark.local / teacher123');
console.log('Parent login:   parent@sampark.local / parent123  (linked to Aarav Mehta)');
