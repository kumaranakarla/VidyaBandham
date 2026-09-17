const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// POST /api/track/visit — a single, unauthenticated beacon the frontend
// fires once per app load (see app.component.ts). No path/referrer/IP is
// stored, on purpose: this only feeds the admin dashboard's rough "hits
// this week/month" curiosity number, not real analytics.
router.post('/visit', (req, res) => {
  try {
    db.prepare('INSERT INTO page_hits (id, created_at) VALUES (?, ?)').run(
      crypto.randomUUID(),
      new Date().toISOString()
    );
  } catch (e) {
    // A dropped hit is never worth failing the page load over.
    console.error('Failed to record page hit:', e);
  }
  res.status(204).end();
});

module.exports = router;
