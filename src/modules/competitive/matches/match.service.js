// src/modules/competitive/matches/match.service.js

// ========================================================
// Competitive Match Service (v2.0)
//
// ⚠️ CRÍTICO:
// - Token é único (AZ- + 10)
// - Match lock: 1 por jogador
// - token só existe quando match entra em vigor
// - Handshake: invite pendente antes do ACTIVE
// ========================================================

const { getDb } = require("../../../database/sqlite");
const { generateTokenBody, formatFullToken } = require("./match.tokens");
const { MATCH_STATUS, LOCK_TYPES, MATCH_TIMERS } = require("./match.constants");

function now() {
  return Date.now();
}

function minutesFromNow(min) {
  return now() + min * 60 * 1000;
}

function userHasAnyLock(userId) {
  const db = getDb();
  const row = db.prepare("SELECT lockType, token FROM competitive_locks WHERE userId = ?").get(userId);
  return row || null;
}

// ✅ NEW: UPSERT lock (blindagem perfeita)
function setLock(userId, lockType, token) {
  const db = getDb();
  const ts = now();

  db.prepare(
    `
    INSERT INTO competitive_locks (userId, lockType, token, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET
      lockType = excluded.lockType,
      token = excluded.token,
      updatedAt = excluded.updatedAt
  `
  ).run(userId, lockType, token || null, ts, ts);
}

function createLock(userId, lockType, token) {
  // mantive por compatibilidade interna
  return setLock(userId, lockType, token);
}

function clearLock(userId) {
  const db = getDb();
  db.prepare("DELETE FROM competitive_locks WHERE userId = ?").run(userId);
}

function logMatchEvent(token, type, payload) {
  const db = getDb();
  db.prepare(
    `INSERT INTO competitive_match_events (token, type, payload, createdAt)
     VALUES (?, ?, ?, ?)`
  ).run(token, type, payload ? JSON.stringify(payload) : null, now());
}

function generateUniqueToken() {
  const db = getDb();

  // ⚠️ Segurança: tenta N vezes antes de desistir
  for (let i = 0; i < 30; i++) {
    const body = generateTokenBody();
    const full = formatFullToken(body);
    const exists = db.prepare("SELECT 1 FROM competitive_matches WHERE token = ?").get(full);
    if (!exists) return full;
  }

  throw new Error("Falha ao gerar token único (excedeu tentativas).");
}

// ========================================================
// createMatchActive
// Só cria ACTIVE quando opponent aceita
// ========================================================
function createMatchActive({ challengerId, opponentId }) {
  const db = getDb();

  // ========================================================
  // Match lock (blindagem)
  // ========================================================
  const lockA = userHasAnyLock(challengerId);
  if (lockA) {
    return { ok: false, reason: "LOCKED", lock: lockA };
  }

  const lockB = userHasAnyLock(opponentId);
  if (lockB) {
    return { ok: false, reason: "OPPONENT_LOCKED", lock: lockB };
  }

  const token = generateUniqueToken();
  const ts = now();
  const expiresAt = minutesFromNow(MATCH_TIMERS.MATCH_EXPIRES_MINUTES);

  const tx = db.transaction(() => {
    const res = db.prepare(
      `INSERT INTO competitive_matches
       (token, challengerId, opponentId, status, createdAt, startedAt, expiresAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(token, challengerId, opponentId, MATCH_STATUS.ACTIVE, ts, ts, expiresAt, ts);

    createLock(challengerId, LOCK_TYPES.ACTIVE, token);
    createLock(opponentId, LOCK_TYPES.ACTIVE, token);

    logMatchEvent(token, "MATCH_CREATED", { challengerId, opponentId });
    return res.lastInsertRowid;
  });

  const matchId = tx();
  return {
    ok: true,
    match: {
      id: matchId,
      token,
      challengerId,
      opponentId,
      expiresAt,
    },
  };
}

module.exports = {
  createMatchActive,
  userHasAnyLock,
  setLock,
  clearLock,
};
