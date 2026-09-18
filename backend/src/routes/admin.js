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

  // Subscription attempts that never became a paid row — cancelled at
  // checkout, a verification mismatch, or the Razorpay order itself
  // failing to create. This is what answers "why aren't more people
  // subscribing", not just "how many did".
  const failedAttemptsCount = db
    .prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'failed'")
    .get().count;

  const failedAttemptsByReason = db
    .prepare(
      `SELECT COALESCE(failure_reason, 'unknown') AS reason, COUNT(*) AS count
       FROM subscriptions WHERE status = 'failed' GROUP BY reason`
    )
    .all();

  const recentFailedAttempts = db
    .prepare(
      `SELECT u.email, u.name, s.amount, COALESCE(s.failure_reason, 'unknown') AS reason, s.created_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.status = 'failed'
       ORDER BY s.created_at DESC
       LIMIT 20`
    )
    .all();

  const hitsAllTime = db.prepare('SELECT COUNT(*) AS count FROM page_hits').get().count;
  const hits7 = db.prepare('SELECT COUNT(*) AS count FROM page_hits WHERE created_at >= ?').get(last7).count;
  const hits30 = db.prepare('SELECT COUNT(*) AS count FROM page_hits WHERE created_at >= ?').get(last30).count;

  // Per-account login activity — added mainly to answer "how many times has
  // the demo teacher@vb / parent@vb login actually been used", but covers
  // every account so it's useful beyond just the demo ones.
  const DEMO_EMAILS = new Set(['teacher@vb', 'parent@vb']);
  const loginRows = db
    .prepare(
      `SELECT email, name, role, COALESCE(login_count, 0) AS loginCount, last_login_at AS lastLoginAt
       FROM users
       ORDER BY loginCount DESC, email ASC`
    )
    .all();
  const logins = loginRows.map((r) => ({
    email: r.email,
    name: r.name,
    role: r.role,
    loginCount: r.loginCount,
    lastLoginAt: r.lastLoginAt,
    isDemo: DEMO_EMAILS.has(r.email),
  }));

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
      failed: {
        total: failedAttemptsCount,
        byReason: Object.fromEntries(failedAttemptsByReason.map((r) => [r.reason, r.count])),
        recent: recentFailedAttempts.map((r) => ({
          email: r.email,
          name: r.name,
          amountRupees: Math.round(r.amount / 100),
          reason: r.reason,
          createdAt: r.created_at,
        })),
      },
    },
    hits: { last7Days: hits7, last30Days: hits30, allTime: hitsAllTime },
    logins,
  });
});

module.exports = router;
