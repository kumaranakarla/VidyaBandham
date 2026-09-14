const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireTeacher } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.id, s.name, s.roll, s.parent_user_id, u.email AS parent_email
       FROM students s LEFT JOIN users u ON u.id = s.parent_user_id
       WHERE s.class_id = ? ORDER BY s.roll`
    )
    .all(req.user.classId);
  res.json({ students: rows });
});

router.post('/', requireAuth, requireTeacher, (req, res) => {
  const name = (req.body?.name || '').trim();
  const roll = (req.body?.roll || '').trim();
  if (!name || !roll) return res.status(400).json({ error: 'Name and roll number are required.' });

  const student = { id: crypto.randomUUID(), name, roll, class_id: req.user.classId };
  db.prepare('INSERT INTO students (id, name, roll, class_id, parent_user_id) VALUES (@id, @name, @roll, @class_id, NULL)').run(
    student
  );
  res.status(201).json({ student });
});

// Creates a parent login and links it to this student in one step, so a
// teacher can onboard a parent from the app instead of editing a database.
router.post('/:id/parent', requireAuth, requireTeacher, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ? AND class_id = ?').get(req.params.id, req.user.classId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const email = (req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password || '';
  const name = (req.body?.name || '').trim() || `${student.name}'s parent`;
  if (!email || password.length < 6) {
    return res.status(400).json({ error: 'A valid email and a password of at least 6 characters are required.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const parentId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, class_id, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(parentId, email, bcrypt.hashSync(password, 10), 'parent', name, req.user.classId, student.id);
  db.prepare('UPDATE students SET parent_user_id = ? WHERE id = ?').run(parentId, student.id);

  res.status(201).json({ parent: { id: parentId, email, name } });
});

module.exports = router;
