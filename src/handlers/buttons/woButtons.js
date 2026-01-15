/**
 * src/handlers/buttons/woButtons.js
 *
 * Staff actions para W.O.
 */

const { MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { finalizeConfirmedResult } = require("../../services/resultFinalizeService");

async function handleWoButtons(client, interaction) {
  const [action, reqId] = interaction.customId.split(":");
  const req = await prisma.woRequest.findUnique({ where: { id: reqId } });
  if (!req) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });

  if (action === "wo_staff_approve") {
    // cria Result 1x0 pro autor
    const result = await prisma.result.create({
      data: {
        guildId: req.guildId,
        matchId: req.matchId,
        authorId: req.authorId,
        opponentId: req.opponentId,
        homeScore: 1,
        awayScore: 0,
        status: "CONFIRMED",
        printUrl: req.printUrl,
      },
    });

    await finalizeConfirmedResult({ client, guildId: req.guildId, resultId: result.id, channelId: interaction.channelId, cleanupMessageIds:[interaction.message.id] });

    await prisma.woRequest.update({ where: { id: reqId }, data: { status: "APPROVED" } });
    return interaction.update({ components: [], content: "✅ W.O confirmado." });
  }

  if (action === "wo_staff_edit") {
    const modal = new ModalBuilder().setCustomId(`wo_edit:${reqId}`).setTitle("Editar Placar do W.O");
    const home = new TextInputBuilder().setCustomId("home").setLabel("Gols do Autor").setStyle(TextInputStyle.Short).setRequired(true);
    const away = new TextInputBuilder().setCustomId("away").setLabel("Gols do Oponente").setStyle(TextInputStyle.Short).setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(home), new ActionRowBuilder().addComponents(away));
    return interaction.showModal(modal);
  }

  if (action === "wo_staff_deny") {
    await prisma.woRequest.update({ where: { id: reqId }, data: { status: "DENIED" } });
    return interaction.update({ components: [], content: "❌ W.O recusado pela staff." });
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Ação inválida." });
}

module.exports = { handleWoButtons };
