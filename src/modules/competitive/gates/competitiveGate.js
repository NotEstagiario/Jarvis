// src/modules/competitive/gates/competitiveGate.js

// ========================================================
// Competitive Gate
//
// ESTE GATE protege todos comandos competitivos.
// Regras:
// - checa canal correto (quando exigido)
// - checa cargo competitivo
// - checa punição ativa
// - presidente bypass total
// ========================================================

const azyron = require("../../../config/azyronIds");
const { getCompetitiveProfile } = require("../../global/profiles/profile.service");

function now() {
  return Date.now();
}

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

async function gateCompetitive(interaction, opts = {}) {
  const { requiredChannelId = null } = opts;

  // Presidente bypass
  if (isPresident(interaction.user.id)) return { ok: true };

  // Canal obrigatório
  if (requiredChannelId && interaction.channelId !== requiredChannelId) {
    return {
      ok: false,
      reason: `⚠️ Este comando só pode ser usado no canal correto.`,
    };
  }

  // Cargo competitivo
  const member = interaction.member;
  if (!member?.roles?.cache?.has(azyron.roles.competitive)) {
    return {
      ok: false,
      reason: `⚠️ Você não possui o cargo de **Competitivo**.`,
    };
  }

  // Punição
  const profile = getCompetitiveProfile(interaction.user.id);
  if (profile?.punishedUntil && Number(profile.punishedUntil) > now()) {
    const seconds = Math.ceil((Number(profile.punishedUntil) - now()) / 1000);
    return {
      ok: false,
      reason: `⛔ Você está punido e não pode usar comandos competitivos agora.\nTempo restante: **${seconds}s**`,
    };
  }

  return { ok: true };
}

module.exports = {
  gateCompetitive,
};
