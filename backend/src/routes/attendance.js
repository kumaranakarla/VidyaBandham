const express = require('express');
const db = require('../db');
const { requireAuth, requireTeacher } = require('../auth');

const router = express.Router();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/attendance?date=YYYY-MM-DD (defaults to today)
router.get('/', requireAuth, (req, res) => {
  const date = req.query.date || todayKey();

  if (req.user.role === 'teacher') {
    const students = db.prepare('SELECT id, name, roll FROM students WHERE class_id = ? ORDER BY roll').all(req.user.classId);
    const marks = db
      .prepare('SELECT student_id, present FROM attendance WHERE class_id = ? AND date = ?')
      .all(req.user.classId, date);
    const byStudent = Object.fromEntries(marks.map((m) => [m.student_id, !!m.present]));
    const roster = students.map((s) => ({ ...s, present: byStudent[s.id] ?? true }));
    return res.json({ date, roster });
  }

  // parent: just their child's status
  if (!req.user.studentId) return res.json({ date, present: null });
  const mark = db
    .prepare('SELECT present FROM attendance WHERE class_id = ? AND date = ? AND student_id = ?')
    .get(req.user.classId, date, req.user.studentId);
  res.json({ date, present: mark ? !!mark.present : null });
});

// POST /api/attendance/:date/:studentId  { present: boolean }
router.post('/:date/:studentId', requireAuth, requireTeacher, (req, res) => {
  const { date, studentId } = req.params;
  const present = req.body?.present ? 1 : 0;
  db.prepare(
    `INSERT INTO attendance (class_id, date, student_id, present) VALUES (?, ?, ?, ?)
     ON CONFLICT(class_id, date, student_id) DO UPDATE SET present = excluded.present`
  ).run(req.user.classId, date, studentId, present);
  res.json({ ok: true });
});

module.exports = router;
