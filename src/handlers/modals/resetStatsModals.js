/**
 * src/handlers/modals/resetStatsModals.js
 *
 * [CRÍTICO] Reset de estatísticas (alta staff)
 */

const { MessageFlags, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { STAFF_LOG_CHANNEL_ID } = require("../../config/constants");

async function handleResetStatsModals(client, interaction) {
  const [, mode, targetId] = interaction.customId.split(":");
  const reason = interaction.fields.getTextInputValue("reason");
  const guildId = interaction.guildId;

  const resetData = {
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    xp: 0,
    championships: 0,
    badges: null,
  };

  if (mode === "GLOBAL") {
    await prisma.player.updateMany({ where: { guildId }, data: resetData });
  } else if (mode === "USUARIO" && targetId && targetId !== "NONE") {
    await prisma.player.upsert({
      where: { guildId_discordId: { guildId, discordId: targetId } },
      update: resetData,
      create: { guildId, discordId: targetId, ...resetData },
    });
  }

  // log staff
  const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle("♻️ Reset de Estatísticas Executado")
      .setColor(0xf97316)
      .setDescription(
        `**Executor:** <@${interaction.user.id}>\n` +
        `**Modo:** ${mode}\n` +
        (mode === "USUARIO" ? `**Usuário:** <@${targetId}>\n` : "") +
        `\n**Justificativa:**\n> ${reason}`
      )
      .setTimestamp(new Date());

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  }

  return interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: "✅ Reset concluído e registrado no log.",
  });
}

module.exports = { handleResetStatsModals };
