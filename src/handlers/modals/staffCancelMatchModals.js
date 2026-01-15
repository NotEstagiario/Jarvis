/**
 * src/handlers/modals/staffCancelMatchModals.js
 *
 * Modal de cancelamento de partida por token.
 */

const { MessageFlags } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { STAFF_LOG_CHANNEL_ID } = require("../../config/constants");

async function handleStaffCancelMatchModals(client, interaction) {
  const [, token] = interaction.customId.split(":");
  const reason = interaction.fields.getTextInputValue("reason");

  const match = await prisma.match.findFirst({
    where: { OR: [{ token }, { id: token }], guildId: interaction.guildId },
  });

  if (!match) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Partida não encontrada." });

  await prisma.match.update({ where: { id: match.id }, data: { status: "CANCELED", endedAt: new Date() } });

  const log = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(()=>null);
  if (log) {
    await log.send({
      content:
        `🛑 **Partida cancelada pela STAFF**\n` +
        `Token: \`${match.token || match.id}\`\n` +
        `Autor: <@${match.authorId}> | Oponente: <@${match.opponentId}>\n` +
        `Motivo: ${reason}`,
    }).catch(()=>{});
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Partida cancelada e registrada no log." });
}

module.exports = { handleStaffCancelMatchModals };
