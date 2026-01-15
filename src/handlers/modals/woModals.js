/**
 * src/handlers/modals/woModals.js
 *
 * Modal de justificativa do W.O.
 */

const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { EMBED_FOOTER, STAFF_LOG_CHANNEL_ID } = require("../../config/constants");

async function handleWoModals(client, interaction) {
  const [prefix, reqId] = interaction.customId.split(":");
  if (prefix !== "wo_reason") {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Modal inválido." });
  }

  const reason = interaction.fields.getTextInputValue("reason");
  const req = await prisma.woRequest.update({
    where: { id: reqId },
    data: { reason, status: "STAFF_REVIEW" },
  });

  const embed = new EmbedBuilder()
    .setTitle("🧾 Solicitação de W.O")
    .setColor(0xf59e0b)
    .setDescription(
      `**Autor:** <@${req.authorId}>\n` +
      `**Oponente:** <@${req.opponentId}>\n` +
      `**Token:** \`${req.token || req.matchId}\`\n\n` +
      `**Motivo:**\n> ${reason}\n\n` +
      `**Print:** ${req.printUrl}`
    )
    .setFooter({ text: EMBED_FOOTER });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`wo_staff_approve:${req.id}`).setLabel("Confirmar (1x0 Autor)").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`wo_staff_edit:${req.id}`).setLabel("Confirmar (Editar Placar)").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`wo_staff_deny:${req.id}`).setLabel("Recusar").setStyle(ButtonStyle.Danger),
  );

  const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(()=>null);
  if (logChannel) await logChannel.send({ embeds:[embed], components:[row] }).catch(()=>{});

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Solicitação enviada para análise da staff." });
}

module.exports = { handleWoModals };
