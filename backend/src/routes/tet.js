const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Read-only reference material — any logged-in user (teacher or parent) can
// browse it, since TET prep is useful to anyone in the app, not just the
// teacher of one class.
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tet_questions ORDER BY subject, id').all();
  res.json({ questions: rows });
});

module.exports = router;
