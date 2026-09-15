const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// The "2026 (New)" tab: the freshly-added, official AP TET 2026 real-exam
// questions, kept on their own router mounted at its own path
// (/api/tet-2026, see server.js) rather than folded into the main /api/tet
// router. That's a deliberate separation, not an accident of where the code
// landed — the plan is to eventually put this content behind a paid
// subscription, and having its own route from day one means a future
// subscription-check middleware can be inserted right here (or in the
// server.js mount line) without touching the main TET Prep / Mock Test
// routes or data at all.
//
// For now this only requires being logged in, same as everything else in
// the app — there is no subscription/payment logic yet.
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tet_questions WHERE year = 2026 ORDER BY source, subject, id').all();
  res.json({ questions: rows });
});

module.exports = router;
