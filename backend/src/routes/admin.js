const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

// A simple, no-frills "curiosity" dashboard for the app owner — total
// members, recent signups, subscription/revenue counts, and site hits.
// Deliberately not a real analytics product: no charts, no per-page
// breakdowns, just enough numbers to sanity-check that the app is being
// used, from the same JWT login every other page uses (role === 'admin').
function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const nowIso = new Date().toISOString();
  const last7 = daysAgoIso(7);
  const last30 = daysAgoIso(30);

  const usersByRole = db.prepare('SELECT role, COUNT(*) AS count FROM users GROUP BY role').all();

  const newSignups7 = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE created_at IS NOT NULL AND created_at >= ?")
    .get(last7).count;
  const newSignups30 = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE created_at IS NOT NULL AND created_at >= ?")
    .get(last30).count;

  const activeSubs = db
    .prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'paid' AND current_period_end > ?")
    .get(nowIso).count;

  const paidTotals = db
    .prepare("SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS totalPaise FROM subscriptions WHERE status = 'paid'")
    .get();

  const recentSubscribers = db
    .prepare(
      `SELECT u.email, u.name, s.amount, s.current_period_end, s.created_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.status = 'paid'
       ORDER BY s.created_at DESC
       LIMIT 10`
    )
    .all();

  const hitsAllTime = db.prepare('SELECT COUNT(*) AS count FROM page_hits').get().count;
  const hits7 = db.prepare('SELECT COUNT(*) AS count FROM page_hits WHERE created_at >= ?').get(last7).count;
  const hits30 = db.prepare('SELECT COUNT(*) AS count FROM page_hits WHERE created_at >= ?').get(last30).count;

  res.json({
    users: {
      byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r.count])),
      newSignups: { last7Days: newSignups7, last30Days: newSignups30 },
    },
    subscriptions: {
      active: activeSubs,
      totalPaid: paidTotals.count,
      totalRevenueRupees: Math.round(paidTotals.totalPaise / 100),
      recent: recentSubscribers.map((r) => ({
        email: r.email,
        name: r.name,
        amountRupees: Math.round(r.amount / 100),
        currentPeriodEnd: r.current_period_end,
        paidAt: r.created_at,
      })),
    },
    hits: { last7Days: hits7, last30Days: hits30, allTime: hitsAllTime },
  });
});

module.exports = router;
