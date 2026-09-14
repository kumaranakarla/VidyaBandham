const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireTeacher } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM homework WHERE class_id = ? ORDER BY created_at DESC')
    .all(req.user.classId);
  res.json({ items: rows });
});

router.post('/', requireAuth, requireTeacher, (req, res) => {
  const subject = (req.body?.subject || '').trim();
  const task = (req.body?.task || '').trim();
  const due = (req.body?.due || '').trim() || 'Due date to be confirmed';
  if (!subject || !task) return res.status(400).json({ error: 'Subject and task are required.' });

  const item = { id: crypto.randomUUID(), class_id: req.user.classId, subject, task, due, created_at: new Date().toISOString() };
  db.prepare(
    'INSERT INTO homework (id, class_id, subject, task, due, created_at) VALUES (@id, @class_id, @subject, @task, @due, @created_at)'
  ).run(item);
  res.status(201).json({ item });
});

module.exports = router;
