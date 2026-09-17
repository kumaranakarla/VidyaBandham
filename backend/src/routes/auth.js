const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

// Public self-signup — only for TET Prep subscribers. Teacher and parent
// accounts are still created by a teacher/admin from inside the app, not
// through this route (there's no self-signup path for those roles).
router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Try logging in instead.' });
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password_hash: bcrypt.hashSync(String(password), 10),
    role: 'tet_subscriber',
    name: String(name).trim(),
    created_at: new Date().toISOString(),
  };
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(user.id, user.email, user.password_hash, user.role, user.name, user.created_at);

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  const token = signToken(created);
  res.status(201).json({
    token,
    user: { id: created.id, role: created.role, name: created.name, classId: created.class_id, studentId: created.student_id },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Could not sign in. Check the email and password and try again.' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, role: user.role, name: user.name, classId: user.class_id, studentId: user.student_id },
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
