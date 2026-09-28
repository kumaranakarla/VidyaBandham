const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// LEAP Q's & A's tab -- "TET 2026 Practice Set - Subject 2A" batch.
// Free for everyone who's logged in: unlike tet2026.js, there is
// deliberately no paywall/subscription check here. Mirrors appsc.js's
// shape (flat question list + a picker summary), grouped by subject
// instead of by (group, year, paper) since this batch has no such
// nesting -- just 6 flat subjects.
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM leap_questions ORDER BY subject, position')
    .all();

  const subjectsMap = new Map();
  for (const r of rows) {
    if (!subjectsMap.has(r.subject)) {
      subjectsMap.set(r.subject, {
        key: r.subject,
        label: r.subject_label,
        total: 0,
      });
    }
    subjectsMap.get(r.subject).total += 1;
  }

  res.json({ questions: rows, subjects: [...subjectsMap.values()] });
});

module.exports = router;
