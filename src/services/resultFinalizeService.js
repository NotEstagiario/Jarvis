/**
 * src/services/resultFinalizeService.js
 *
 * =========================================================
 * ✅ Finalização Oficial do Resultado
 * =========================================================
 * Este é o "coração" competitivo:
 * - gera banner final
 * - aplica stats /perfil
 * - fecha Match
 * - marca rankingDirty (preparação Season)
 *
 * [CRÍTICO]
 * Qualquer mudança aqui pode afetar ranking, perfil e auditoria.
 */

const path = require("path");
const { AttachmentBuilder } = require("discord.js");

const { prisma } = require("../prismaClient");
const { computeMatchXp } = require("./xpService");
const { grantRematchCredits } = require("./rematchService");
const { checkAntiFarmAfterFinalize } = require("./antiFarmAlertService");
const { generateResultBanner } = require("./bannerService");

async function finalizeConfirmedResult({ client, guildId, resultId, channelId, cleanupMessageIds = [] }) {
  // =========================================================
  // 1) Buscar resultado + match
  // =========================================================
  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) throw new Error("Result não encontrado.");

  const match = await prisma.match.findUnique({ where: { id: result.matchId } });
  if (!match) throw new Error("Match não encontrado.");

  // =========================================================
  // 2) Gera banner (buffer)
  // =========================================================
  const buffer = await generateResultBanner({
    authorId: result.authorId,
    opponentId: result.opponentId,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
  });

  const attachment = new AttachmentBuilder(buffer, { name: `resultado_${resultId}.png` });

  // =========================================================
  // 3) Posta banner final no canal
  // =========================================================
  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(channelId);

  const msg = await channel.send({ files: [attachment] });

  // =========================================================
  // 3.1) Limpeza de mensagens intermediárias
  // =========================================================
  // [IMPORTANTE]
  // No competitivo, o canal deve ficar limpo.
  // Então removemos mensagens do wizard/convites deixando apenas o banner final.
  const cleanup = new Set(cleanupMessageIds);
  // tenta limpar wizard salvo no DB
  if (result.wizardMessageId) cleanup.add(result.wizardMessageId);
  if (match.inviteMessageId) cleanup.add(match.inviteMessageId);

  for (const mid of cleanup) {
    if (!mid || mid === msg.id) continue;
    await channel.messages.delete(mid).catch(() => {});
  }


  // =========================================================
  // 4) Aplica stats no Player (usa core já existente)
  // =========================================================
  // Regra:
  // - vitória: +1 win
  // - derrota: +1 loss
  // - empate: +1 draw
  // - goalsFor/goalsAgainst para ambos
  //
  // XP: simples por enquanto (pode evoluir)
  const isDraw = result.homeScore === result.awayScore;

  // author = home
  // opponent = away
  const authorWin = result.homeScore > result.awayScore;
  const opponentWin = result.homeScore < result.awayScore;

  // upsert players (garante existência)
  await prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId: result.authorId } },
    update: {},
    create: { guildId, discordId: result.authorId, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, xp: 0, championships: 0, badges: null },
  });

  await prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId: result.opponentId } },
    update: {},
    create: { guildId, discordId: result.opponentId, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, xp: 0, championships: 0, badges: null },
  });

  // update author
  await prisma.player.update({
    where: { guildId_discordId: { guildId, discordId: result.authorId } },
    data: {
      wins: { increment: authorWin ? 1 : 0 },
      losses: { increment: opponentWin ? 1 : 0 },
      draws: { increment: isDraw ? 1 : 0 },
      goalsFor: { increment: result.homeScore },
      goalsAgainst: { increment: result.awayScore },
      xp: { increment: authorXpDelta },
    },
  });

  // update opponent
  await prisma.player.update({
    where: { guildId_discordId: { guildId, discordId: result.opponentId } },
    data: {
      wins: { increment: opponentWin ? 1 : 0 },
      losses: { increment: authorWin ? 1 : 0 },
      draws: { increment: isDraw ? 1 : 0 },
      goalsFor: { increment: result.awayScore },
      goalsAgainst: { increment: result.homeScore },
      xp: { increment: opponentXpDelta },
    },
  });

  // =========================================================
  // 5) Finaliza DB (result + match)
  // =========================================================
  await prisma.result.update({
    where: { id: resultId },
    data: {
      status: "FINALIZED",
      wizardMessageId: result.wizardMessageId || null,
      wizardChannelId: result.wizardChannelId || null,
      bannerMessageId: msg.id,
      bannerChannelId: channelId,
      finalizedAt: new Date(),
    },
  });

  // =========================================================
  // 6.1) Anti-Farm Alertas (soft/hard)
  // =========================================================
  await checkAntiFarmAfterFinalize({
    client,
    guildId,
    playerA: result.authorId,
    playerB: result.opponentId,
    bannerLink: msg.url,
  }).catch(()=>{});

  await prisma.match.update({
    where: { id: match.id },
    data: { status: "FINALIZED", endedAt: new Date() },
  });

  // =========================================================
  // 6) Prepara Season futura (rankingDirty)
  // =========================================================
  await prisma.rankingState.upsert({
    where: { guildId },
    update: { rankingDirty: true, lastUpdatedAt: new Date() },
    create: { guildId, rankingDirty: true, lastUpdatedAt: new Date() },
  }).catch(()=>{});


  // =========================================================
  // 7) REVANCHE (janela 5min para o perdedor)
  // =========================================================
  const loserId = isDraw ? null : (authorWin ? result.opponentId : result.authorId);
  const winnerId = isDraw ? null : (authorWin ? result.authorId : result.opponentId);

  if (loserId && winnerId) {
    await grantRematchCredits({ guildId, loserId, winnerId }).catch(() => {});
  }

  return { messageId: msg.id };
}

module.exports = { finalizeConfirmedResult };
