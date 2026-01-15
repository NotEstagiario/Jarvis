/**
 * src/services/cooldownService.js
 *
 * [CRITICAL][INTEGRITY]
 * Prevents command spamming. Owner bypass allowed.
 */

const { prisma } = require("../prismaClient");
const { isOwner } = require("./ownerService");

async function checkAndUpdateCooldown({ guildId, userId, commandKey, cooldownSeconds }) {
  if (isOwner(userId)) return { allowed: true, retryAfter: 0 };

  const now = new Date();
  const existing = await prisma.commandCooldown.findUnique({
    where: { guildId_userId_commandKey: { guildId, userId, commandKey } }
  });

  if (!existing) {
    await prisma.commandCooldown.create({ data: { guildId, userId, commandKey, lastUsedAt: now } });
    return { allowed: true, retryAfter: 0 };
  }

  const diff = (now.getTime() - existing.lastUsedAt.getTime()) / 1000;
  if (diff < cooldownSeconds) {
    return { allowed: false, retryAfter: Math.ceil(cooldownSeconds - diff) };
  }

  await prisma.commandCooldown.update({
    where: { guildId_userId_commandKey: { guildId, userId, commandKey } },
    data: { lastUsedAt: now }
  });

  return { allowed: true, retryAfter: 0 };
}

module.exports = { checkAndUpdateCooldown };
