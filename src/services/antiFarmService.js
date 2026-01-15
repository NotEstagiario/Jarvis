/**
 * src/services/antiFarmService.js
 *
 * =========================================================
 *  🚨 ANTI-FARM (Alertas invisíveis para Staff)
 * =========================================================
 * Regras do servidor:
 * - 4 partidas/dia vs mesmo oponente => ALERTA (não bloqueia)
 * - 6 partidas/dia vs mesmo oponente => TRAVA (não permite registrar)
 * - 10-12 partidas/semana vs mesmo oponente => ALERTA severo com relatório
 *
 * [CRÍTICO]
 * Esse sistema NÃO deve punir automaticamente (exceto trava hard).
 * Ele serve para auditoria e integridade do competitivo.
 */

const { prisma } = require("../prismaClient");

function getDayRange(date = new Date()) {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end = new Date(date); end.setHours(23,59,59,999);
  return { start, end };
}

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=sun
  const diff = (day === 0 ? -6 : 1) - day; // monday
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return { start, end };
}

async function countFinishedMatchesBetween({ guildId, userA, userB, range }) {
  return prisma.match.count({
    where: {
      guildId,
      status: "FINISHED",
      finishedAt: { gte: range.start, lte: range.end },
      OR: [
        { authorId: userA, opponentId: userB },
        { authorId: userB, opponentId: userA },
      ]
    }
  });
}

async function listFinishedMatchesBetween({ guildId, userA, userB, range }) {
  return prisma.match.findMany({
    where: {
      guildId,
      status: "FINISHED",
      finishedAt: { gte: range.start, lte: range.end },
      OR: [
        { authorId: userA, opponentId: userB },
        { authorId: userB, opponentId: userA },
      ]
    },
    orderBy: { finishedAt: "desc" },
    take: 20,
    include: { result: true },
  });
}

module.exports = {
  getDayRange,
  getWeekRange,
  countFinishedMatchesBetween,
  listFinishedMatchesBetween,
};
