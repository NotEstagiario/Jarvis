/**
 * src/services/bindingService.js
 *
 * [SECURITY][CRITICAL]
 * Channel binding must never be automatic. Only the Owner can approve bindings.
 *
 * NOTE: Discord limitation: ephemeral messages can only be sent to the interaction author.
 * Therefore approval is handled via STAFF approval channel embeds (not DMs).
 */

const { prisma } = require("../prismaClient");
const { isOwner } = require("./ownerService");

async function getBinding(guildId, commandKey) {
  return prisma.commandChannelBinding.findUnique({ where: { guildId_commandKey: { guildId, commandKey } } });
}

async function isAllowedInChannel({ guildId, commandKey, channelId }) {
  const binding = await getBinding(guildId, commandKey);
  if (!binding) return { allowed: true, binding: null };
  if (binding.status !== "APPROVED") return { allowed: true, binding }; // allow while pending/denied
  return { allowed: binding.channelId === channelId, binding };
}

module.exports = { getBinding, isAllowedInChannel };
