const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireTeacher } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM diary_entries WHERE class_id = ? ORDER BY created_at DESC')
    .all(req.user.classId);
  res.json({ entries: rows });
});

router.post('/', requireAuth, requireTeacher, (req, res) => {
  const note = (req.body?.note || '').trim();
  if (!note) return res.status(400).json({ error: 'Note cannot be empty.' });
  const entry = {
    id: crypto.randomUUID(),
    class_id: req.user.classId,
    who: req.user.name,
    note,
    created_at: new Date().toISOString(),
  };
  db.prepare('INSERT INTO diary_entries (id, class_id, who, note, created_at) VALUES (@id, @class_id, @who, @note, @created_at)').run(
    entry
  );
  res.status(201).json({ entry });
});

module.exports = router;
