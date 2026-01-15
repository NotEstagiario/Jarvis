/**
 * src/services/competitiveGateService.js
 *
 * [CRITICAL]
 * Blocks competitive commands unless the user has Competitive role.
 * Owner bypass enabled.
 */

const { MessageFlags } = require("discord.js");
const { prisma } = require("../prismaClient");
const { isOwner } = require("./ownerService");
const { GAMEPLAY_ROLES } = require("../config/constants");
const { getCompetitiveDeniedMessage } = require("./trashTalkService");

async function assertCompetitive(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const player = await prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId: userId } },
    update: {},
    create: { guildId, discordId: userId },
  });

  const lang = player.language || "PT_BR";
  if (isOwner(userId)) return { ok: true, lang };

  const ok = interaction.member?.roles?.cache?.has(GAMEPLAY_ROLES.COMPETITIVE);
  if (!ok) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: getCompetitiveDeniedMessage(lang, userId) });
    return { ok: false, lang };
  }
  return { ok: true, lang };
}

module.exports = { assertCompetitive };
