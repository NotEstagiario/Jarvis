// src/modules/global/premium/premiumReset.service.js

const { getDb } = require("../../../database/sqlite");

const COOLDOWN_MS = 31 * 24 * 60 * 60 * 1000; // 31 dias

function now() {
  return Date.now();
}

function getLastPremiumResetAt(userId) {
  const db = getDb();
  const row = db.prepare("SELECT lastResetAt FROM premium_profile_resets WHERE userId = ?").get(userId);
  return row?.lastResetAt || null;
}

function canUsePremiumReset(userId) {
  const last = getLastPremiumResetAt(userId);
  if (!last) return { ok: true, remainingMs: 0, nextAt: null };

  const diff = now() - last;
  if (diff >= COOLDOWN_MS) return { ok: true, remainingMs: 0, nextAt: null };

  const remainingMs = COOLDOWN_MS - diff;
  return { ok: false, remainingMs, nextAt: last + COOLDOWN_MS };
}

function markPremiumResetUsed(userId) {
  const db = getDb();
  const t = now();

  db.prepare(
    `
    INSERT INTO premium_profile_resets (userId, lastResetAt)
    VALUES (?, ?)
    ON CONFLICT(userId) DO UPDATE SET lastResetAt = excluded.lastResetAt
    `
  ).run(userId, t);

  return t;
}

module.exports = {
  COOLDOWN_MS,
  getLastPremiumResetAt,
  canUsePremiumReset,
  markPremiumResetUsed,
};
