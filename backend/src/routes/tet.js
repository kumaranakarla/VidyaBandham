const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
const id = () => crypto.randomUUID();

// Read-only reference material — any logged-in user (teacher or parent) can
// browse it, since TET prep is useful to anyone in the app, not just the
// teacher of one class.
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tet_questions ORDER BY subject, id').all();
  res.json({ questions: rows });
});

// Fisher-Yates shuffle — used to pick a random set of questions for a mock test.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/tet/mock/start?year=&subject=&count=20
// Builds a random mock test from the question bank. The correct_option is
// deliberately left out of the response so it can't be read from the
// network tab — it's only checked server-side when the test is submitted.
router.get('/mock/start', requireAuth, (req, res) => {
  const { year, subject } = req.query;
  const count = Math.min(Math.max(parseInt(req.query.count, 10) || 20, 5), 50);

  let sql = 'SELECT id, subject, question, option_a, option_b, option_c, option_d, source, year FROM tet_questions WHERE 1=1';
  const params = [];
  if (year) {
    sql += ' AND year = ?';
    params.push(year);
  }
  if (subject) {
    sql += ' AND subject = ?';
    params.push(subject);
  }

  const pool = db.prepare(sql).all(...params);
  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  res.json({ questions: picked, available: pool.length });
});

// POST /api/tet/mock/submit
// Body: { year, subject, answers: [{ id, selected }] }  — selected is 1-4 or null.
// Grades server-side against tet_questions, records the attempt against the
// logged-in user (their existing teacher/parent login — no separate mock
// test signup), and returns a per-question review.
router.post('/mock/submit', requireAuth, (req, res) => {
  const { year, subject, answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'No answers submitted.' });
  }

  const getQuestion = db.prepare('SELECT * FROM tet_questions WHERE id = ?');
  let correctCount = 0;
  const results = answers.map((a) => {
    const q = getQuestion.get(a.id);
    if (!q) return null;
    const isCorrect = a.selected === q.correct_option;
    if (isCorrect) correctCount += 1;
    return {
      id: q.id,
      subject: q.subject,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      selected: a.selected ?? null,
      correct_option: q.correct_option,
      isCorrect,
    };
  }).filter(Boolean);

  const total = results.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  db.prepare(
    `INSERT INTO tet_mock_attempts (id, user_id, year, subject, total_questions, correct_answers, score_percent, taken_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id(), req.user.id, year || 'All', subject || 'All', total, correctCount, percent, new Date().toISOString());

  res.json({ total, correct: correctCount, percent, results });
});

// GET /api/tet/mock/history — the logged-in user's own past attempts, newest first.
router.get('/mock/history', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM tet_mock_attempts WHERE user_id = ? ORDER BY taken_at DESC LIMIT 20')
    .all(req.user.id);
  res.json({ attempts: rows });
});

module.exports = router;
