/**
 * src/services/schedulerService.js
 *
 * Scheduler central do bot (rodando a cada 1 minuto).
 * - resolve timeouts de resultados WAITING_OPPONENT
 */

const { prisma } = require("../prismaClient");
const { MessageFlags } = require("discord.js");
const { buildStaffReviewEmbedWithButtons } = require("./staffReviewService");
const { STAFF_LOG_CHANNEL_ID } = require("../config/constants");

async function processInviteExpirations(client) {
  const now = new Date();
  const invites = await prisma.matchmakingInvite.findMany({ where: { status: "ACTIVE", expiresAt: { lte: now } } }).catch(()=>[]);
  for (const inv of invites) {
    await prisma.matchmakingInvite.update({ where: { id: inv.id }, data: { status: "EXPIRED" } }).catch(()=>{});
    if (inv.channelId && inv.messageId) {
      const ch = await client.channels.fetch(inv.channelId).catch(()=>null);
      if (ch) {
        const msg = await ch.messages.fetch(inv.messageId).catch(()=>null);
        if (msg) await msg.edit({ components: [] }).catch(()=>{});
      }
    }
  }
}

async function processResultTimeouts(client) {
  const now = new Date();

  const pending = await prisma.result.findMany({
    where: {
      status: "WAITING_OPPONENT",
      opponentDeadlineAt: { not: null },
    },
  });

  for (const r of pending) {
    // reminder
    if (r.opponentReminderAt && r.opponentReminderAt <= now && !r.reminderSentAt) {
      const ch = await client.channels.fetch(r.channelId).catch(()=>null);
      if (ch) {
        await ch.send({ content: `<@${r.opponentId}> ⏳ Últimos **2 minutos** para confirmar ou recusar o resultado.` }).catch(()=>{});
      }
      await prisma.result.update({ where: { id: r.id }, data: { reminderSentAt: now } }).catch(()=>{});
    }

    // deadline
    if (r.opponentDeadlineAt && r.opponentDeadlineAt <= now && !r.timeoutTriggeredAt) {
      await prisma.confidenceFlag.create({ data: { resultId: r.id, flag: "TIMEOUT_STAFF_REVIEW" } }).catch(()=>{});
      await prisma.result.update({ where: { id: r.id }, data: { status: "STAFF_REVIEW", timeoutTriggeredAt: now } }).catch(()=>{});

      const reviewChannel = await client.channels.fetch(r.staffReviewChannelId).catch(()=>null);
      if (reviewChannel) {
        const { embed, components } = await buildStaffReviewEmbedWithButtons(r.id, "TIMEOUT");
        await reviewChannel.send({ embeds:[embed], components }).catch(()=>{});
      }

      const log = await client.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(()=>null);
      if (log) await log.send({ content: `⏱️ Staff Review automático (TIMEOUT) criado para Result ${r.id}` }).catch(()=>{});
    }
  }
}

function startSchedulers(client) {
  // 1 minuto conforme recomendação
  setInterval(() => processInviteExpirations(client).catch(()=>{}), 60 * 1000);
  setInterval(() => processResultTimeouts(client).catch(()=>{}), 60 * 1000);
}

module.exports = { startSchedulers };
