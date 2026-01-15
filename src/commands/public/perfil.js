/**
 * src/commands/public/perfil.js
 *
 * /perfil
 * - Always ephemeral (private)
 * - Cooldown 30s (owner bypass)
 * - Dynamic embed color based on player's rank role
 */

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { COMMAND_KEYS, COOLDOWNS } = require("../../config/constants");
const { checkAndUpdateCooldown } = require("../../services/cooldownService");
const { getRankByMemberRoles } = require("../../domain/ranks");
const { prisma } = require("../../prismaClient");
const { buildPerfilEmbed } = require("../../ui/embeds/perfilEmbeds");
const { t } = require("../../i18n");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Veja seu perfil competitivo."),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    // Ensure player exists in DB (minimal create).
    await prisma.player.upsert({
      where: { guildId_discordId: { guildId, discordId: userId } },
      update: {},
      create: { guildId, discordId: userId }
    });

    // Cooldown check
    const cd = await checkAndUpdateCooldown({
      guildId,
      userId,
      commandKey: COMMAND_KEYS.PERFIL,
      cooldownSeconds: COOLDOWNS.PERFIL_SECONDS,
    });

    if (!cd.allowed) {
      const player = await prisma.player.findUnique({ where: { guildId_discordId: { guildId, discordId: userId } }});
      const lang = player?.language || "PT_BR";
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `⏳ ${t(lang,"common.cooldown",{seconds: cd.retryAfter})}`
      });
    }

    const player = await prisma.player.findUnique({
      where: { guildId_discordId: { guildId, discordId: userId } }
    });

    const lang = player?.language || "PT_BR";
    const rank = getRankByMemberRoles(interaction.member);

    const embed = buildPerfilEmbed({ lang, member: interaction.user, rank });

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [embed],
    });
  }
};
