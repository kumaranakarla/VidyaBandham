const express = require('express');
const db = require('../db');
const { requireAuth, requireTeacher } = require('../auth');

const router = express.Router();

// GET /api/fees
// teacher -> fee status for every student in the class
// parent  -> fee status for just their own child
router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'teacher') {
    const rows = db
      .prepare(
        `SELECT f.*, s.name AS student_name, s.roll
         FROM fees f JOIN students s ON s.id = f.student_id
         WHERE f.class_id = ? ORDER BY s.roll`
      )
      .all(req.user.classId);
    return res.json({ fees: rows });
  }

  if (!req.user.studentId) return res.json({ fees: [] });
  const row = db.prepare('SELECT * FROM fees WHERE student_id = ?').get(req.user.studentId);
  res.json({ fees: row ? [row] : [] });
});

// POST /api/fees/setup  { term, amount, dueDate }
// Creates/overwrites a fee record for every student in the class for a given term.
router.post('/setup', requireAuth, requireTeacher, (req, res) => {
  const term = (req.body?.term || '').trim();
  const amount = Number(req.body?.amount);
  const dueDate = (req.body?.dueDate || '').trim();
  if (!term || !amount || !dueDate) {
    return res.status(400).json({ error: 'Term, amount, and due date are required.' });
  }

  const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(req.user.classId);
  const upsert = db.prepare(
    `INSERT INTO fees (student_id, class_id, term, amount, due_date, paid, parent_marked_paid_at, paid_at)
     VALUES (@student_id, @class_id, @term, @amount, @due_date, 0, NULL, NULL)
     ON CONFLICT(student_id) DO UPDATE SET
       class_id = excluded.class_id, term = excluded.term, amount = excluded.amount,
       due_date = excluded.due_date, paid = 0, parent_marked_paid_at = NULL, paid_at = NULL`
  );

  db.exec('BEGIN');
  try {
    students.forEach((s) =>
      upsert.run({ student_id: s.id, class_id: req.user.classId, term, amount, due_date: dueDate })
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.status(201).json({ ok: true, count: students.length });
});

// POST /api/fees/:studentId/mark-paid  (parent says "I've paid")
router.post('/:studentId/mark-paid', requireAuth, (req, res) => {
  if (req.user.role !== 'parent' || req.user.studentId !== req.params.studentId) {
    return res.status(403).json({ error: 'Not allowed.' });
  }
  const fee = db.prepare('SELECT * FROM fees WHERE student_id = ?').get(req.params.studentId);
  if (!fee) return res.status(404).json({ error: 'No fee record found.' });

  db.prepare('UPDATE fees SET parent_marked_paid_at = ? WHERE student_id = ?').run(
    new Date().toISOString(),
    req.params.studentId
  );
  res.json({ ok: true });
});

// POST /api/fees/:studentId/confirm  (teacher confirms payment received)
router.post('/:studentId/confirm', requireAuth, requireTeacher, (req, res) => {
  const fee = db.prepare('SELECT * FROM fees WHERE student_id = ? AND class_id = ?').get(req.params.studentId, req.user.classId);
  if (!fee) return res.status(404).json({ error: 'No fee record found.' });

  const now = new Date().toISOString();
  db.prepare('UPDATE fees SET paid = 1, paid_at = ? WHERE student_id = ?').run(now, req.params.studentId);
  db.prepare('INSERT INTO fee_history (id, student_id, term, amount, paid_on) VALUES (?, ?, ?, ?, ?)').run(
    require('crypto').randomUUID(),
    fee.student_id,
    fee.term,
    fee.amount,
    now
  );

  res.json({ ok: true });
});

module.exports = router;
