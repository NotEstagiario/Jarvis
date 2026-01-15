/**
 * Handlers dos botões do /registrarresultado.
 *
 * - regres_wo:<matchId>       -> dispara o fluxo de W.O (placeholder, será pendência #5)
 * - regres_normal:<matchId>   -> inicia o wizard do resultado normal (placar)
 *
 * IMPORTANTE:
 * Aqui só fazemos o "redirect" para o fluxo correto.
 */

const { MessageFlags } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { startNormalResultWizard } = require("../../services/resultService");

async function handleRegistrarResultadoButtons(interaction) {
  const [prefix, matchId] = interaction.customId.split(":");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Partida não encontrada." });
  }

  // Segurança: só quem está no match pode clicar
  const uid = interaction.user.id;
  if (match.authorId !== uid && match.opponentId !== uid) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Você não faz parte desta partida." });
  }

  if (prefix === "regres_wo") {
    // Pendência #5: fluxo completo do /resultadowo
    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "⚠️ Fluxo de W.O será implementado no próximo bloco (Pendência #5).",
    });
  }

  if (prefix === "regres_normal") {
    // Verifica 10 minutos
    const acceptedAt = match.acceptedAt ? new Date(match.acceptedAt).getTime() : 0;
    const can = acceptedAt && Date.now() - acceptedAt >= 10 * 60 * 1000;
    if (!can) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "⏳ Ainda não se passaram 10 minutos desde o início do confronto.",
      });
    }

    // Dispara wizard (reaproveitando sistema atual)
    // Aqui usamos um customId que o result wizard já entende ou criamos um atalho.
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Wizard iniciado no canal!" });

    const opponentId = match.authorId === uid ? match.opponentId : match.authorId;
    await startNormalResultWizard({
      channel: interaction.channel,
      guildId: interaction.guildId,
      matchId: match.id,
      authorId: uid,
      opponentId,
    });

    return;
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Ação inválida." });
}

module.exports = { handleRegistrarResultadoButtons };
