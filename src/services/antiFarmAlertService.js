/**
 * src/services/antiFarmAlertService.js
 *
 * =========================================================
 * ✅ Anti-Farm / Alertas invisíveis (Pendência #7)
 * =========================================================
 *
 * Regras:
 * - 4 partidas/dia vs mesmo oponente => ALERTA (soft)
 * - 6 partidas/dia vs mesmo oponente => TRAVA (hard) (bloqueio implementado no matchService em update seguinte)
 * - 10-12 partidas/semana vs mesmo oponente => ALERTA semanal (dump confrontos)
 *
 * Esse serviço NÃO bloqueia por si só (exceto quando integrado).
 * Ele detecta e notifica no ALERTS_CHANNEL.
 */

const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../prismaClient");
const { ALERTS_CHANNEL_ID, EMBED_FOOTER } = require("../config/constants");

function startOfDay() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}
function startOfWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 sunday
  const diff = (day === 0 ? 6 : day-1); // monday=0
  d.setDate(d.getDate() - diff);
  d.setHours(0,0,0,0);
  return d;
}

async function countMatchesBetween({ guildId, a, b, since }) {
  return prisma.match.count({
    where: {
      guildId,
      status: "FINALIZED",
      endedAt: { gte: since },
      OR: [
        { authorId: a, opponentId: b },
        { authorId: b, opponentId: a },
      ],
    },
  });
}

async function listRecentResults({ guildId, a, b, since }) {
  return prisma.result.findMany({
    where: {
      guildId,
      finalizedAt: { gte: since },
      OR: [
        { authorId: a, opponentId: b },
        { authorId: b, opponentId: a },
      ],
      status: "FINALIZED",
    },
    orderBy: { finalizedAt: "desc" },
    take: 12,
  });
}

async function sendAlert(client, guildId, embed) {
  const ch = await client.channels.fetch(ALERTS_CHANNEL_ID).catch(()=>null);
  if (!ch) return;
  await ch.send({ embeds:[embed] }).catch(()=>{});
}

async function checkAntiFarmAfterFinalize({ client, guildId, playerA, playerB, bannerLink }) {
  const daySince = startOfDay();
  const weekSince = startOfWeek();

  const dayCount = await countMatchesBetween({ guildId, a: playerA, b: playerB, since: daySince });
  const weekCount = await countMatchesBetween({ guildId, a: playerA, b: playerB, since: weekSince });

  // Soft alert 4/day
  if (dayCount === 4) {
    const embed = new EmbedBuilder()
      .setTitle("🚨 Anti-Farm ALERTA (4 confrontos no dia)")
      .setColor(0xef4444)
      .setDescription(`**A:** <@${playerA}>\n**B:** <@${playerB}>\n\n**Contagem hoje:** ${dayCount}\n**Contagem semana:** ${weekCount}`)
      .addFields({ name: "Banner", value: bannerLink ? bannerLink : "N/A" })
      .setFooter({ text: EMBED_FOOTER });
    await sendAlert(client, guildId, embed);
  }

  // Weekly alert 10
  if (weekCount === 10) {
    const results = await listRecentResults({ guildId, a: playerA, b: playerB, since: weekSince });
    const lines = results.map(r=>`• ${r.homeScore}x${r.awayScore} (RID:${r.id})`).join("\n") || "Sem dados";
    const embed = new EmbedBuilder()
      .setTitle("🚨 Anti-Farm ALERTA SEMANAL (10 confrontos)")
      .setColor(0xf59e0b)
      .setDescription(`**A:** <@${playerA}>\n**B:** <@${playerB}>\n\n**Contagem semana:** ${weekCount}\n\n**Últimos resultados:**\n${lines}`)
      .addFields({ name: "Banner", value: bannerLink ? bannerLink : "N/A" })
      .setFooter({ text: EMBED_FOOTER });
    await sendAlert(client, guildId, embed);
  }

  return { dayCount, weekCount };
}

module.exports = { checkAntiFarmAfterFinalize };
