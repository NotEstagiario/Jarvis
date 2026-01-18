// src/modules/global/ranks/ranks.service.js

// ========================================================
// Rank & XP Service (GLOBAL)
//
// Implementa o Word:
// - Vitória: +10 XP
// - Empate: +5 XP
// - Derrota: -15 XP
//
// Modificador por diferença de rank:
// +2 ranks acima => 2.5x
// +1 rank acima => 1.5x
//  0           => 1.0x
// -1 rank abaixo=> 0.5x
// -2 rank abaixo=> 0.1x
//
// Buff por rank (somado):
// XP = (base * diffMult * rankMult) + rankBonus
//
// Também define:
// - seasonRank TEXT (rank real, ex: "cobre")
// - sync XP mínimo do rank quando rank editado (staff)
// - aplicar roles de rank automaticamente
// ========================================================

const logger = require("../../../core/logger");
const { getDb } = require("../../../database/sqlite");
const { ensureCompetitiveProfile, getCompetitiveProfile } = require("../profiles/profile.service");

const { getRankById, getRankIndex, getRankByXp, getRanks } = require("./ranks.catalog");

function now() {
  return Date.now();
}

const BASE_XP = {
  WIN: 10,
  DRAW: 5,
  LOSS: -15,
};

function diffRankMultiplier(diff) {
  if (diff >= 2) return 2.5;
  if (diff === 1) return 1.5;
  if (diff === 0) return 1.0;
  if (diff === -1) return 0.5;
  return 0.1; // -2 ou menor
}

function clampInt(n, min, max) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function computeXpGain({
  result, // "WIN"|"DRAW"|"LOSS"
  playerRankId,
  opponentRankId,
}) {
  const base = BASE_XP[result] ?? 0;

  const playerRank = getRankById(playerRankId);
  const oppRank = getRankById(opponentRankId);

  const diff = getRankIndex(oppRank.id) - getRankIndex(playerRank.id); // positivo = opponent acima
  const multDiff = diffRankMultiplier(diff);

  const multRank = Number(playerRank?.buff?.mult ?? 1.0);
  const bonus = Number(playerRank?.buff?.bonus ?? 0);

  const raw = base * multDiff * multRank + bonus;
  const rounded = Math.round(raw);

  return {
    base,
    diff,
    multDiff,
    multRank,
    bonus,
    raw,
    xp: rounded,
  };
}

// ========================================================
// seasonRank helpers
// ========================================================
function getSeasonRankFromProfile(profile) {
  const id = String(profile?.seasonRank || "unranked").toLowerCase();
  return getRankById(id).id;
}

function getRankFromXpAndSeason(profile) {
  // se já tem seasonRank setado, respeita como rank "real"
  // senão calcula por XP
  const forced = String(profile?.seasonRank || "").trim();
  if (forced) return getRankById(forced).id;

  return getRankByXp(profile?.xp ?? 0).id;
}

function setSeasonRankDb(userId, rankId) {
  const db = getDb();
  ensureCompetitiveProfile(userId);

  const id = getRankById(rankId).id;

  db.prepare(
    `
    UPDATE competitive_profile
    SET seasonRank = ?, updatedAt = ?
    WHERE userId = ?
    `
  ).run(id, now(), userId);

  return getCompetitiveProfile(userId);
}

function setXpDb(userId, xp) {
  const db = getDb();
  ensureCompetitiveProfile(userId);

  db.prepare(
    `
    UPDATE competitive_profile
    SET xp = ?, updatedAt = ?
    WHERE userId = ?
    `
  ).run(clampInt(xp, 0, 9999999), now(), userId);

  return getCompetitiveProfile(userId);
}

function ensureXpMinimumForRank(userId, rankId) {
  const profile = getCompetitiveProfile(userId);
  const currentXp = Number(profile?.xp ?? 0);

  const rank = getRankById(rankId);
  const min = Number(rank.minXp ?? 0);

  if (currentXp < min) {
    return setXpDb(userId, min);
  }

  return profile;
}

// ========================================================
// Roles sync
// ========================================================
async function syncRankRoles(guild, member, rankId) {
  if (!guild || !member) return;

  try {
    const ranks = getRanks().filter((r) => r.roleId);
    const chosen = getRankById(rankId);

    const toRemove = ranks
      .map((r) => r.roleId)
      .filter(Boolean)
      .filter((rid) => rid !== chosen.roleId);

    // remove outros ranks
    if (toRemove.length > 0) {
      await member.roles.remove(toRemove).catch(() => null);
    }

    // add rank role
    if (chosen.roleId && !member.roles.cache.has(chosen.roleId)) {
      await member.roles.add(chosen.roleId).catch(() => null);
    }
  } catch (err) {
    logger.warn("Falha ao sincronizar cargos de rank.", err);
  }
}

// ========================================================
// Staff API
// ========================================================
async function setSeasonRankStaff({ guild, targetMember, targetUserId, rankId }) {
  // define rank real
  setSeasonRankDb(targetUserId, rankId);

  // força XP mínimo do rank
  ensureXpMinimumForRank(targetUserId, rankId);

  // aplica cargos
  await syncRankRoles(guild, targetMember, rankId);

  return getCompetitiveProfile(targetUserId);
}

module.exports = {
  computeXpGain,
  getSeasonRankFromProfile,
  getRankFromXpAndSeason,

  setSeasonRankDb,
  ensureXpMinimumForRank,
  syncRankRoles,
  setSeasonRankStaff,
};
