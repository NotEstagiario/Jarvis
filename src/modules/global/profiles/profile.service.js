// src/modules/global/profiles/profile.service.js

// ========================================================
// Profile Service (GLOBAL)
// Objetivo: substituir PlayerService antigo usando SQLite.
// ========================================================

const { getDb } = require("../../../database/sqlite");

function now() {
  return Date.now();
}

function ensureUser(userId) {
  const db = getDb();

  const found = db.prepare("SELECT userId FROM users WHERE userId = ?").get(userId);
  if (found) return;

  const t = now();
  db.prepare(
    `
    INSERT INTO users (userId, language, languageUpdatedAt, style, createdAt, updatedAt)
    VALUES (?, 'pt-BR', NULL, NULL, ?, ?)
    `
  ).run(userId, t, t);
}

function ensureCompetitiveProfile(userId) {
  const db = getDb();
  ensureUser(userId);

  const found = db.prepare("SELECT userId FROM competitive_profile WHERE userId = ?").get(userId);
  if (found) return;

  const t = now();
  db.prepare(
    `
    INSERT INTO competitive_profile (
      userId,
      xp,
      wins, losses, draws,
      currentStreak, bestStreak,
      goalsScored, goalsConceded,
      badges,
      nemesisId, favoriteId, bestWinText,
      punishedUntil,
      updatedAt
    )
    VALUES (
      ?,
      0,
      0, 0, 0,
      0, 0,
      0, 0,
      NULL,
      NULL, NULL, NULL,
      NULL,
      ?
    )
    `
  ).run(userId, t);
}

function getCompetitiveProfile(userId) {
  const db = getDb();
  ensureCompetitiveProfile(userId);

  return db.prepare("SELECT * FROM competitive_profile WHERE userId = ?").get(userId);
}

module.exports = {
  ensureUser,
  ensureCompetitiveProfile,
  getCompetitiveProfile,
};
