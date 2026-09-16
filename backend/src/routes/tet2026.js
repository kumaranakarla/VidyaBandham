const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { activeSubscriptionFor, FREE_PAPERS } = require('./subscription');

const router = express.Router();

// The "2026 (New)" tab: the freshly-added, official AP TET 2026 real-exam
// questions, kept on their own router mounted at its own path
// (/api/tet-2026, see server.js) rather than folded into the main /api/tet
// router. That separation is what let the paywall below get added without
// touching the main TET Prep / Mock Test routes or data at all.
//
// Everyone who is logged in can see every paper's *name*, and can practice
// the two FREE_PAPERS in full. Every other paper's questions are withheld
// (not sent to the client at all — this isn't just a UI lock) unless the
// caller has full access.
//
// "Full access" means either: an existing teacher/parent account (they
// already use the rest of the app for free — the paywall is specifically
// for the new public tet_subscriber signups, not a new toll on existing
// users), or a tet_subscriber with an active row in `subscriptions`.
router.get('/', requireAuth, (req, res) => {
  const allRows = db.prepare('SELECT * FROM tet_questions WHERE year = 2026 ORDER BY source, subject, id').all();

  const isSchoolAccount = req.user.role === 'teacher' || req.user.role === 'parent';
  const active = isSchoolAccount ? null : activeSubscriptionFor(req.user.id);
  const hasAccess = isSchoolAccount || !!active;

  const paperNames = [...new Set(allRows.map((r) => r.source))];
  const papers = paperNames.map((name) => {
    const free = FREE_PAPERS.includes(name);
    return { name, free, locked: !free && !hasAccess };
  });

  const questions = allRows.filter((r) => FREE_PAPERS.includes(r.source) || hasAccess);

  res.json({
    questions,
    papers,
    subscription: { active: hasAccess, currentPeriodEnd: active ? active.current_period_end : null },
  });
});

module.exports = router;
