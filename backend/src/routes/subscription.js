const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// ₹299 for 30 days (1 month), paid manually each time it lapses (no
// auto-recurring billing / Razorpay Subscriptions API — just a one-off
// Order each renewal).
const SUBSCRIPTION_AMOUNT_PAISE = 29900;
const SUBSCRIPTION_DAYS = 30;

// Test-mode keys by default so the flow can be built and exercised end to
// end before real keys exist. Swap these for live keys in production by
// setting the RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET environment variables —
// nothing in this file needs to change.
const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

function now() {
  return new Date().toISOString();
}

function activeSubscriptionFor(userId) {
  const nowIso = now();
  return db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND status = 'paid' AND current_period_end > ?
       ORDER BY current_period_end DESC LIMIT 1`
    )
    .get(userId, nowIso);
}

// GET /api/subscription/status — whether the signed-in user currently has
// paywall access, and until when. Any signed-in role can call this (a
// teacher/parent account will simply always come back inactive, since only
// tet_subscriber accounts ever pay).
router.get('/status', requireAuth, (req, res) => {
  const active = activeSubscriptionFor(req.user.id);
  res.json({
    active: !!active,
    currentPeriodEnd: active ? active.current_period_end : null,
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    keyId: KEY_ID,
  });
});

// POST /api/subscription/create-order — starts a Razorpay Order for one
// subscription period. The client takes the returned order id straight into
// Razorpay's Checkout.js widget (loaded globally in index.html).
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `tet-${req.user.id}-${Date.now()}`,
      notes: { userId: req.user.id, purpose: 'TET 2026 subscription (30 days)' },
    });

    db.prepare(
      `INSERT INTO subscriptions (id, user_id, status, razorpay_order_id, amount, created_at)
       VALUES (?, ?, 'created', ?, ?, ?)`
    ).run(crypto.randomUUID(), req.user.id, order.id, SUBSCRIPTION_AMOUNT_PAISE, now());

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(502).json({ error: 'Could not start the payment. Please try again in a moment.' });
  }
});

// POST /api/subscription/verify — called by the client after Razorpay
// Checkout succeeds, with the three values Razorpay hands back. We recompute
// the HMAC signature server-side (never trust the client's own "it worked")
// before marking the subscription paid.
router.post('/verify', requireAuth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    db.prepare(
      `UPDATE subscriptions SET status = 'failed', razorpay_payment_id = ?, failure_reason = 'signature_mismatch'
       WHERE razorpay_order_id = ? AND user_id = ?`
    ).run(razorpay_payment_id, razorpay_order_id, req.user.id);
    return res.status(400).json({ error: 'Payment could not be verified.' });
  }

  const periodEnd = new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = db
    .prepare(
      `UPDATE subscriptions SET status = 'paid', razorpay_payment_id = ?, current_period_end = ?
       WHERE razorpay_order_id = ? AND user_id = ?`
    )
    .run(razorpay_payment_id, periodEnd, razorpay_order_id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'No matching order found for this payment.' });
  }

  res.json({ ok: true, currentPeriodEnd: periodEnd });
});

// POST /api/subscription/report-failure — the client calls this whenever a
// payment attempt doesn't reach /verify at all: the user closed the
// Checkout widget without paying, or the order couldn't even be created.
// Without this, those drop-offs would leave no trace ('created' rows just
// sit there forever, indistinguishable from someone who's mid-payment) —
// this is what lets the admin dashboard show *why* people abandon checkout,
// not just how many paid.
const KNOWN_FAILURE_REASONS = new Set([
  'user_cancelled',
  'order_creation_failed',
  'checkout_error',
  // Razorpay itself declined the payment inside the widget (e.g.
  // "International cards are not supported") — the widget stays open for
  // the person to retry with another method, so this can fire more than
  // once for the same order before it's finally paid or abandoned.
  'payment_failed',
]);

// Razorpay's own decline messages are free text ("International cards are
// not supported. Please contact our support team for help") — cap the
// length so nothing oversized ends up in the database or admin table.
const MAX_FAILURE_DETAIL_LENGTH = 300;

router.post('/report-failure', requireAuth, (req, res) => {
  const { orderId, reason, detail } = req.body || {};
  const safeReason = KNOWN_FAILURE_REASONS.has(reason) ? reason : 'unknown';
  const safeDetail = typeof detail === 'string' && detail.trim() ? detail.trim().slice(0, MAX_FAILURE_DETAIL_LENGTH) : null;

  if (orderId) {
    const result = db
      .prepare(
        `UPDATE subscriptions SET status = 'failed', failure_reason = ?, failure_detail = ?
         WHERE razorpay_order_id = ? AND user_id = ? AND status = 'created'`
      )
      .run(safeReason, safeDetail, orderId, req.user.id);
    if (result.changes === 0) {
      // Already resolved (e.g. paid in another tab, or a previous
      // payment.failed on this same order already recorded it) — nothing
      // more to record, but not an error either.
      return res.json({ ok: true, recorded: false });
    }
    return res.json({ ok: true, recorded: true });
  }

  // No order was ever created (Razorpay's own order-create call failed) —
  // log a standalone row so the failure still shows up in the admin count.
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, status, amount, failure_reason, failure_detail, created_at)
     VALUES (?, ?, 'failed', ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), req.user.id, SUBSCRIPTION_AMOUNT_PAISE, safeReason, safeDetail, now());
  res.json({ ok: true, recorded: true });
});

module.exports = router;
module.exports.activeSubscriptionFor = activeSubscriptionFor;
module.exports.FREE_PAPERS = [
  'AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1',
  'AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2',
  'TET Practice Question Bank – Subject 1A (Mathematics)',
];
