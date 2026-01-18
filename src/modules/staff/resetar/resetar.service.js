// src/modules/staff/resetar/resetar.service.js

const { EmbedBuilder } = require("discord.js");

const logger = require("../../../core/logger");
const azyron = require("../../../config/azyronIds");

const { getDb } = require("../../../database/sqlite");
const { resetCompetitiveStaffFull } = require("../../global/profiles/profile.service");

// ========================================================
// Guards
// ========================================================
function isPresident(userId) {
  return String(userId) === String(azyron.presidentUserId);
}

function isResetChannel(channelId) {
  return String(channelId) === String(azyron.channels.resetar);
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function presidentMention() {
  return `<@${azyron.presidentUserId}>`;
}

// ========================================================
// Password
// ========================================================
function checkGlobalPassword(input) {
  const expected = String(process.env.RESET_GLOBAL_PASSWORD || "").trim();
  const got = String(input || "").trim();

  if (!expected) return { ok: false, reason: "MISSING_ENV" };
  if (!got) return { ok: false, reason: "EMPTY" };

  return { ok: got === expected, reason: got === expected ? "OK" : "WRONG" };
}

// ========================================================
// Logs
// ========================================================
async function sendLogEmbed(guild, payload) {
  try {
    const ch = await guild.channels.fetch(azyron.channels.logs).catch(() => null);
    if (!ch || !ch.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(payload.ok ? 0x35c46a : 0xd83c3c)
      .setDescription(payload.description)
      .setTimestamp(Date.now());

    await ch.send({ embeds: [embed] });
  } catch (err) {
    logger.error("Falha ao enviar logs /resetar", err);
  }
}

// ========================================================
// Rank Roles (Word)
// MVP NÃO entra aqui (cargo temporário)
// ========================================================
function getCompetitiveRankRoleIds() {
  const roleIds = [];

  // ranks base
  if (azyron?.ranks?.cobre?.roleId) roleIds.push(azyron.ranks.cobre.roleId);
  if (azyron?.ranks?.ferro?.roleId) roleIds.push(azyron.ranks.ferro.roleId);
  if (azyron?.ranks?.bronze?.roleId) roleIds.push(azyron.ranks.bronze.roleId);
  if (azyron?.ranks?.prata?.roleId) roleIds.push(azyron.ranks.prata.roleId);
  if (azyron?.ranks?.ouro?.roleId) roleIds.push(azyron.ranks.ouro.roleId);
  if (azyron?.ranks?.diamante?.roleId) roleIds.push(azyron.ranks.diamante.roleId);

  // ⚠️ MVP NÃO é removido em resets (Word)
  // if (azyron?.ranks?.mvp?.roleId) roleIds.push(azyron.ranks.mvp.roleId);

  // uniq + strings
  return Array.from(new Set(roleIds.map((x) => String(x))));
}

async function removeCompetitiveRankRolesFromMember(member) {
  try {
    if (!member) return { ok: false, reason: "NO_MEMBER" };

    const roleIds = getCompetitiveRankRoleIds();
    if (!roleIds.length) return { ok: false, reason: "NO_RANK_ROLES" };

    const toRemove = roleIds.filter((rid) => member.roles.cache.has(rid));
    if (!toRemove.length) return { ok: true, removed: 0 };

    await member.roles.remove(toRemove).catch(() => {});
    return { ok: true, removed: toRemove.length };
  } catch (err) {
    logger.warn("Falha ao remover cargos de rank (resetar).", err);
    return { ok: false, reason: "ERROR" };
  }
}

async function removeCompetitiveRankRolesFromUser(guild, userId) {
  try {
    if (!guild || !userId) return { ok: false, reason: "INVALID" };

    const member = await guild.members.fetch(String(userId)).catch(() => null);
    if (!member) return { ok: false, reason: "NOT_IN_GUILD" };

    return removeCompetitiveRankRolesFromMember(member);
  } catch (err) {
    logger.warn("Falha ao remover cargos de rank de usuário (resetar).", err);
    return { ok: false, reason: "ERROR" };
  }
}

// ========================================================
// Executors
// ========================================================
function resetAllCompetitiveProfiles() {
  const db = getDb();

  const rows = db.prepare("SELECT userId FROM competitive_profile").all();
  for (const r of rows) {
    resetCompetitiveStaffFull(String(r.userId));
  }
}

// ✅ versão Word: reseta + remove rank roles
async function resetAllCompetitiveProfilesAndRemoveRanks(guild) {
  const db = getDb();

  const rows = db.prepare("SELECT userId FROM competitive_profile").all();
  for (const r of rows) {
    const uid = String(r.userId);
    resetCompetitiveStaffFull(uid);

    // remove ranks (se estiver no servidor)
    await removeCompetitiveRankRolesFromUser(guild, uid).catch(() => {});
  }
}

module.exports = {
  isPresident,
  isResetChannel,
  nowUnix,
  presidentMention,
  checkGlobalPassword,
  sendLogEmbed,
  resetAllCompetitiveProfiles,

  // rank helpers
  getCompetitiveRankRoleIds,
  removeCompetitiveRankRolesFromMember,
  removeCompetitiveRankRolesFromUser,

  // Word executor
  resetAllCompetitiveProfilesAndRemoveRanks,
};
