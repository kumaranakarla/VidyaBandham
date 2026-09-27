const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// APPSC (Andhra Pradesh Public Service Commission) Model Papers tab --
// mirrors tet2026.js's shape (grouped papers + flat question list) but
// simpler: no paywall yet, since pricing/access for this content hasn't
// been decided (see the project plan doc). Everyone logged in gets full
// access to everything here for now.
//
// A deleted question (officially cancelled by the exam board, correct_option
// left NULL) is still sent to the client so the paper's numbering/count
// stays complete, but the frontend should treat deleted:true as "excluded
// from scoring" rather than hide it outright -- matches how the real exam
// treats a cancelled question (full marks to everyone, not removed from the
// paper). A small number of non-deleted questions also have a NULL
// correct_option -- see the note field -- where the source scan itself
// showed two boxed/circled answers; these are genuine anomalies, not
// missing data.
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM appsc_questions ORDER BY exam_group, year DESC, paper, number')
    .all();

  // Group into a picker structure: one entry per (group, year, paper),
  // each carrying its own subject list and question count -- same idea as
  // PaperSummary in tet-2026.component.ts.
  const paperKey = (r) => `${r.exam_group}||${r.year}||${r.paper}`;
  const papersMap = new Map();
  for (const r of rows) {
    const key = paperKey(r);
    if (!papersMap.has(key)) {
      papersMap.set(key, {
        group: r.exam_group,
        year: r.year,
        paper: r.paper,
        subjects: new Set(),
        total: 0,
      });
    }
    const p = papersMap.get(key);
    p.subjects.add(r.subject);
    p.total += 1;
  }
  const papers = [...papersMap.values()].map((p) => ({
    group: p.group,
    year: p.year,
    paper: p.paper,
    subjects: [...p.subjects],
    total: p.total,
  }));

  res.json({ questions: rows, papers });
});

module.exports = router;
