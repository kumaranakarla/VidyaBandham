const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const id = () => crypto.randomUUID();

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

// GET /api/leap/progress -- the logged-in student's saved answers across
// every LEAP question they've attempted (all subjects at once, since the
// frontend loads the whole question bank up front too). Each row is that
// student's LATEST attempt at that question -- see leap_progress's comment
// in db.js for why retrying overwrites rather than appending.
router.get('/progress', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      'SELECT leap_question_id, selected_option, is_correct, updated_at FROM leap_progress WHERE user_id = ?'
    )
    .all(req.user.id);
  res.json({ progress: rows });
});

// POST /api/leap/progress -- record (or, on a retry, overwrite) the
// logged-in student's answer to one question. Graded server-side against
// leap_questions.correct_option -- same "don't trust the client's grading"
// principle as tet.js's /mock/submit -- so a spoofed selected_option can't
// fake a correct result.
// Body: { leap_question_id, selected_option }
router.post('/progress', requireAuth, (req, res) => {
  const { leap_question_id, selected_option } = req.body || {};
  if (!leap_question_id || ![1, 2, 3, 4].includes(selected_option)) {
    return res.status(400).json({ error: 'leap_question_id and a selected_option (1-4) are required.' });
  }
  const q = db.prepare('SELECT correct_option FROM leap_questions WHERE id = ?').get(leap_question_id);
  if (!q) return res.status(404).json({ error: 'Question not found.' });

  const isCorrect = q.correct_option !== null && selected_option === q.correct_option ? 1 : 0;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO leap_progress (id, user_id, leap_question_id, selected_option, is_correct, updated_at)
     VALUES (@id, @user_id, @leap_question_id, @selected_option, @is_correct, @updated_at)
     ON CONFLICT (user_id, leap_question_id) DO UPDATE SET
       selected_option = excluded.selected_option,
       is_correct = excluded.is_correct,
       updated_at = excluded.updated_at`
  ).run({
    id: id(),
    user_id: req.user.id,
    leap_question_id,
    selected_option,
    is_correct: isCorrect,
    updated_at: now,
  });

  res.json({ is_correct: !!isCorrect, correct_option: q.correct_option });
});

// DELETE /api/leap/progress/:subject -- "Clear answers for this subject":
// wipes the logged-in student's saved progress for just one subject, so
// they can start that subject over from scratch.
router.delete('/progress/:subject', requireAuth, (req, res) => {
  db.prepare(
    `DELETE FROM leap_progress WHERE user_id = ? AND leap_question_id IN (
       SELECT id FROM leap_questions WHERE subject = ?
     )`
  ).run(req.user.id, req.params.subject);
  res.json({ ok: true });
});

module.exports = router;
