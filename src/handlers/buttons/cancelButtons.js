/**
 * src/handlers/buttons/cancelButtons.js
 *
 * =========================================================
 * ✅ BOTÕES: Cancelamento
 * =========================================================
 * - cancel_accept:<reqId>
 * - cancel_deny:<reqId>
 * - cancel_staff_keep:<reqId>
 * - cancel_staff_cancel:<reqId>
 */

const {
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");

const { prisma } = require("../../prismaClient");
const { EMBED_FOOTER, STAFF_LOG_CHANNEL_ID } = require("../../config/constants");
const { cancelMatchById } = require("../../services/cancelService");

async function handleCancelButtons(client, interaction) {
  const id = interaction.customId;

  // =========================================================
  // 1) Oponente aceita cancelamento
  // =========================================================
  if (id.startsWith("cancel_accept:")) {
    const reqId = id.split(":")[1];
    const req = await prisma.matchCancelRequest.findUnique({ where: { id: reqId } });

    if (!req) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });
    if (interaction.user.id !== req.opponentId) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "🚫 Apenas o adversário pode responder." });
    }

    await prisma.matchCancelRequest.update({ where: { id: reqId }, data: { status: "ACCEPTED" } });
    await cancelMatchById({ guildId: req.guildId, matchId: req.matchId, reason: "Cancelamento aceito por ambas as partes." }).catch(()=>{});

    const embed = new EmbedBuilder()
      .setTitle("✅ Cancelamento Confirmado")
      .setColor(0x22c55e)
      .setDescription(`Partida encerrada sem impacto nas estatísticas.\nToken: \`${req.token || req.matchId}\``)
      .setFooter({ text: EMBED_FOOTER });

    // log
    const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel) await logChannel.send({ embeds: [embed] }).catch(()=>{});

    return interaction.update({ embeds: [embed], components: [] });
  }

  // =========================================================
  // 2) Oponente recusa cancelamento -> abrir modal justificativa
  // =========================================================
  if (id.startsWith("cancel_deny:")) {
    const reqId = id.split(":")[1];
    const req = await prisma.matchCancelRequest.findUnique({ where: { id: reqId } });

    if (!req) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });
    if (interaction.user.id !== req.opponentId) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "🚫 Apenas o adversário pode responder." });
    }

    const modal = new ModalBuilder()
      .setCustomId(`cancel_deny_reason:${reqId}`)
      .setTitle("Motivo da Recusa");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Explique por que você NÃO aceita cancelar")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return interaction.showModal(modal);
  }

  // =========================================================
  // 3) Staff decide manter
  // =========================================================
  if (id.startsWith("cancel_staff_keep:")) {
    const reqId = id.split(":")[1];
    await prisma.matchCancelRequest.update({ where: { id: reqId }, data: { status: "DENIED" } }).catch(()=>{});

    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Staff decidiu manter a partida em vigor." });
  }

  // =========================================================
  // 4) Staff decide cancelar
  // =========================================================
  if (id.startsWith("cancel_staff_cancel:")) {
    const reqId = id.split(":")[1];
    const req = await prisma.matchCancelRequest.findUnique({ where: { id: reqId } });
    if (!req) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });

    await prisma.matchCancelRequest.update({ where: { id: reqId }, data: { status: "ACCEPTED" } }).catch(()=>{});
    await cancelMatchById({ guildId: req.guildId, matchId: req.matchId, reason: "Cancelamento aprovado pela Staff." }).catch(()=>{});

    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Staff cancelou a partida." });
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "⚠️ Botão de cancelamento não reconhecido." });
}

module.exports = { handleCancelButtons };
