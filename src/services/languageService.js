/**
 * src/services/languageService.js
 *
 * =========================================================
 *  🌍 SISTEMA DE IDIOMA (PT-BR / EN)
 * =========================================================
 * [CRÍTICO]
 * - Define idioma por jogador no DB (Player.language).
 * - Cooldown padrão: 24h para alterar novamente.
 * - Owner (King N) tem BYPASS total para testes.
 */

const { prisma } = require("../prismaClient");
const { isOwner } = require("./ownerService");

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function ensurePlayer(guildId, userId) {
  return prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId: userId } },
    update: {},
    create: { guildId, discordId: userId }
  });
}

async function canChangeLanguage(guildId, userId) {
  if (isOwner(userId)) return { allowed: true, retryAfterMs: 0 };

  const player = await ensurePlayer(guildId, userId);
  const last = player.languageChangedAt ? new Date(player.languageChangedAt).getTime() : 0;
  const remaining = COOLDOWN_MS - (Date.now() - last);
  if (remaining <= 0) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: remaining };
}

async function setLanguage(guildId, userId, language) {
  return prisma.player.update({
    where: { guildId_discordId: { guildId, discordId: userId } },
    data: { language, languageChangedAt: new Date() }
  });
}

module.exports = { canChangeLanguage, setLanguage, ensurePlayer };
