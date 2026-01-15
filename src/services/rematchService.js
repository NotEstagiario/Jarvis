/**
 * src/services/rematchService.js
 *
 * =========================================================
 * ✅ Sistema de REVANCHE (Pendência #6)
 * =========================================================
 *
 * Regras oficiais:
 * - Após o resultado FINALIZADO:
 *   - Perdedor recebe uma janela de REVANCHE por 5 minutos
 * - Cooldown para enfrentar o mesmo adversário novamente: 1 hora
 * - A revanche pode quebrar esse cooldown apenas 2 vezes
 */

const { prisma } = require("../prismaClient");

const REMATCH_WINDOW_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;

function pairWhere(guildId, a, b) {
  return {
    guildId,
    OR: [
      { authorId: a, opponentId: b },
      { authorId: b, opponentId: a },
    ],
  };
}

async function canFaceAgain({ guildId, playerA, playerB }) {
  const last = await prisma.match.findFirst({
    where: { ...pairWhere(guildId, playerA, playerB), status: "FINALIZED" },
    orderBy: { endedAt: "desc" },
  });

  if (!last?.endedAt) return { ok: true };

  const since = Date.now() - new Date(last.endedAt).getTime();
  if (since >= COOLDOWN_MS) return { ok: true };

  // procura crédito de revanche disponível
  const credit = await prisma.rematchCredit.findFirst({
    where: {
      guildId,
      playerA,
      playerB,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (credit) return { ok: true, creditId: credit.id };

  return { ok: false, remainingMs: COOLDOWN_MS - since };
}

async function grantRematchCredits({ guildId, loserId, winnerId }) {
  const expiresAt = new Date(Date.now() + REMATCH_WINDOW_MS);

  await prisma.rematchCredit.createMany({
    data: [
      { guildId, playerA: loserId, playerB: winnerId, expiresAt },
      { guildId, playerA: loserId, playerB: winnerId, expiresAt },
    ],
  });

  return { expiresAt };
}

async function useRematchCredit(creditId) {
  if (!creditId) return;
  await prisma.rematchCredit.update({ where: { id: creditId }, data: { usedAt: new Date() } }).catch(()=>{});
}

module.exports = { REMATCH_WINDOW_MS, COOLDOWN_MS, canFaceAgain, grantRematchCredits, useRematchCredit };
