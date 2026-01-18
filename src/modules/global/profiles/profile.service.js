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

  // ✅ compatível com schema.sql atual
  db.prepare(
    `
    INSERT INTO competitive_profile (
      userId,

      xp,
      seasonRank,

      wins, losses, draws,
      currentStreak, bestStreak,

      goalsScored, goalsConceded,

      woWins,
      warnings,

      badgesJson,

      nemesisId,
      nemesisLosses,

      favoriteId,
      favoriteWins,

      bestWinOpponentId,
      bestWinGoalsFor,
      bestWinGoalsAgainst,

      punishedUntil,
      updatedAt
    )
    VALUES (
      ?,

      0,
      'unranked',

      0, 0, 0,
      0, 0,

      0, 0,

      0,
      0,

      NULL,

      NULL,
      0,

      NULL,
      0,

      NULL,
      0,
      0,

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

// ========================================================
// Update field (v2.2)
// Usado pelo /editarperfil (staff wizard) e futuros ajustes.
// ========================================================
function updateCompetitiveField(userId, field, value) {
  const db = getDb();
  ensureCompetitiveProfile(userId);

  db.prepare(
    `
    UPDATE competitive_profile
    SET ${field} = ?, updatedAt = ?
    WHERE userId = ?
    `
  ).run(value, now(), userId);

  return getCompetitiveProfile(userId);
}

// ========================================================
// Reset stats (v2.1)
// Usado por /resetpremium e por futuros resets staff.
// ========================================================
function resetCompetitivePublicStats(userId) {
  const db = getDb();
  ensureCompetitiveProfile(userId);

  const t = now();

  // ✅ Regra Word:
  // reset premium = reset real do perfil competitivo
  // - volta seasonRank pro "unranked" (Sem Rank)
  // - limpa rivalidades e badges
  //
  // ⚠️ NÃO resetar campos staff: warnings/woWins/punishedUntil
  db.prepare(
    `
    UPDATE competitive_profile
    SET
      xp = 0,
      seasonRank = 'unranked',

      wins = 0,
      losses = 0,
      draws = 0,

      currentStreak = 0,
      bestStreak = 0,

      goalsScored = 0,
      goalsConceded = 0,

      badgesJson = NULL,

      nemesisId = NULL,
      nemesisLosses = 0,

      favoriteId = NULL,
      favoriteWins = 0,

      bestWinOpponentId = NULL,
      bestWinGoalsFor = 0,
      bestWinGoalsAgainst = 0,

      updatedAt = ?
    WHERE userId = ?
    `
  ).run(t, userId);
}

module.exports = {
  ensureUser,
  ensureCompetitiveProfile,
  getCompetitiveProfile,
  updateCompetitiveField,
  resetCompetitivePublicStats,
};
