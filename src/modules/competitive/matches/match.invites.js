// src/modules/competitive/matches/match.invites.js

// ========================================================
// Competitive Match Invites (v2.0)
// Handshake obrigatório:
// Challenger confirma -> cria invite
// Opponent aceita -> vira match ACTIVE (token gerado)
// ========================================================

const { getDb } = require("../../../database/sqlite");

function now() {
  return Date.now();
}

function createInvite({ challengerId, opponentId, channelId, expiresAt }) {
  const db = getDb();
  const ts = now();

  const res = db
    .prepare(
      `INSERT INTO competitive_match_invites
      (challengerId, opponentId, status, channelId, createdAt, expiresAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(challengerId, opponentId, "pending", channelId, ts, expiresAt, ts);

  return { ok: true, inviteId: res.lastInsertRowid };
}

function getInvite(inviteId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM competitive_match_invites WHERE id = ?`).get(inviteId) || null;
}

function setInviteStatus(inviteId, status) {
  const db = getDb();
  db.prepare(`UPDATE competitive_match_invites SET status = ?, updatedAt = ? WHERE id = ?`).run(status, now(), inviteId);
}

function isInviteExpired(invite) {
  return !invite || (invite.expiresAt && invite.expiresAt <= now());
}

module.exports = {
  createInvite,
  getInvite,
  setInviteStatus,
  isInviteExpired,
};
