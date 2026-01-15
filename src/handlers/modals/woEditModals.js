const { MessageFlags } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { finalizeConfirmedResult } = require("../../services/resultFinalizeService");

async function handleWoEditModals(client, interaction) {
  const [, reqId] = interaction.customId.split(":");
  const req = await prisma.woRequest.findUnique({ where: { id: reqId } });
  if (!req) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });

  const home = Number(interaction.fields.getTextInputValue("home"));
  const away = Number(interaction.fields.getTextInputValue("away"));

  const result = await prisma.result.create({
    data: {
      guildId: req.guildId,
      matchId: req.matchId,
      authorId: req.authorId,
      opponentId: req.opponentId,
      homeScore: home,
      awayScore: away,
      status: "CONFIRMED",
      printUrl: req.printUrl,
    },
  });

  await finalizeConfirmedResult({ client, guildId: req.guildId, resultId: result.id, channelId: interaction.channelId });

  await prisma.woRequest.update({ where: { id: reqId }, data: { status: "APPROVED" } });
  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ W.O confirmado com placar editado." });
}

module.exports = { handleWoEditModals };
