/**
 * src/services/resultTimeoutService.js
 *
 * Responsável por aplicar as regras de timeout na confirmação do adversário.
 *
 * Regras (Pendência #2):
 * - O adversário tem 5 minutos para confirmar/recusar o resultado
 * - Após 5 minutos: o bot avisa "últimos 2 minutos"
 * - Após +2 minutos: cria automaticamente Staff Review por TIMEOUT
 *
 * IMPORTANTE:
 * - Esse arquivo mantém timers em memória. Reiniciar o bot perde timers.
 *   Futuro: persistir no DB (cron/worker).
 */

const { prisma } = require("../prismaClient");
const { buildStaffReviewEmbedWithButtons } = require("./staffReviewService");
const { STAFF_LOG_CHANNEL_ID } = require("../config/constants");
const { MessageFlags } = require("discord.js");

const pending = new Map(); // resultId -> { t1, t2 }

function clearResultTimers(resultId) {
  const entry = pending.get(resultId);
  if (!entry) return;
  clearTimeout(entry.t1);
  clearTimeout(entry.t2);
  pending.delete(resultId);
}

async function scheduleOpponentTimeout(client, resultId) {
  clearResultTimers(resultId);

  // Timer #1: 5min -> lembrete 2min
  const t1 = setTimeout(async () => {
    try {
      const result = await prisma.result.findUnique({ where: { id: resultId } });
      if (!result) return;
      if (result.status !== "WAITING_OPPONENT") return;

      const channel = await client.channels.fetch(result.channelId).catch(() => null);
      if (!channel) return;

      await channel.send({
        content: `<@${result.opponentId}> ⏳ Últimos **2 minutos** para confirmar ou recusar o resultado.`,
      });
    } catch (e) {}
  }, 5 * 60 * 1000);

  // Timer #2: +2min -> Staff Review
  const t2 = setTimeout(async () => {
    try {
      const result = await prisma.result.findUnique({ where: { id: resultId } });
      if (!result) return;
      if (result.status !== "WAITING_OPPONENT") return;

      // Marca flag de TIMEOUT
      await prisma.confidenceFlag.create({
        data: { resultId, flag: "TIMEOUT_STAFF_REVIEW" },
      }).catch(() => {});

      // Atualiza status
      await prisma.result.update({
        where: { id: resultId },
        data: { status: "STAFF_REVIEW" },
      });

      // Envia staff review
      const reviewChannel = await client.channels.fetch(result.staffReviewChannelId).catch(() => null);
      if (!reviewChannel) return;

      const { embed, components } = await buildStaffReviewEmbedWithButtons(resultId, "TIMEOUT");
      await reviewChannel.send({ embeds: [embed], components });

      // Log staff
      const logChannel = await client.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChannel) {
        await logChannel.send({
          content: `⏱️ Staff Review automático (TIMEOUT) criado para Result ${resultId} | Match ${result.matchId}`,
        });
      }
    } catch (e) {}
  }, 7 * 60 * 1000);

  pending.set(resultId, { t1, t2 });
}

module.exports = { scheduleOpponentTimeout, clearResultTimers };
