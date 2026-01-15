/**
 * src/services/gameplayService.js
 *
 * [CRITICAL][SECURITY]
 * Gameplay mode selection system (Casual vs Competitive).
 * Only one can be active.
 * Switch cooldown: 7 days (owner bypass).
 */

const { prisma } = require("../prismaClient");
const { isOwner } = require("./ownerService");

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function ensurePlayer(guildId, userId) {
  return prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId: userId } },
    update: {},
    create: { guildId, discordId: userId }
  });
}

async function canSwitchGameplay(guildId, userId) {
  if (isOwner(userId)) return { allowed: true, retryAfterMs: 0 };
  const player = await ensurePlayer(guildId, userId);

  // This update uses updatedAt as lastChange (later we'll create a column gameplayChangedAt)
  const last = new Date(player.updatedAt).getTime();
  const remaining = ONE_WEEK_MS - (Date.now() - last);
  if (remaining <= 0) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: remaining };
}

module.exports = { ensurePlayer, canSwitchGameplay };
