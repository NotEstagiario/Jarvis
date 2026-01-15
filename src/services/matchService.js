/**
 * src/services/matchService.js
 *
 * [CRITICAL][INTEGRITY]
 * This service is the single source of truth for match lifecycle.
 * All commands must call this service instead of editing Match table directly.
 */

const { prisma } = require("../prismaClient");
const { generateMatchToken } = require("../utils/tokenUtils");

async function getActiveMatchForUser(guildId, userId) {
  return prisma.match.findFirst({
    where: {
      guildId,
      status: "ACTIVE",
      OR: [{ authorId: userId }, { opponentId: userId }]
    }
  });
}

async function getOpenMatchForUser(guildId, userId) {
  // [CRITICAL] Open = PENDING or ACTIVE. Blocks starting new matches.
  return prisma.match.findFirst({
    where: {
      guildId,
      status: { in: ["PENDING", "ACTIVE"] },
      OR: [{ authorId: userId }, { opponentId: userId }]
    }
  });
}

async function createPendingMatch({ guildId, authorId, opponentId }) {
  // [CRITICAL] Pending match has NO token.
  return prisma.match.create({
    data: { guildId, authorId, opponentId, status: "PENDING" }
  });
}

async function acceptMatch({ guildId, matchId }) {
  // [CRITICAL] Token generated only when match becomes ACTIVE.
  const token = generateMatchToken();
  return prisma.match.update({
    where: { id: matchId },
    data: { status: "ACTIVE", acceptedAt: new Date(), token }
  });
}

async function declineMatch({ matchId }) {
  return prisma.match.update({
    where: { id: matchId },
    data: { status: "CANCELED" }
  });
}

module.exports = {
  getActiveMatchForUser,
  getOpenMatchForUser,
  createPendingMatch,
  acceptMatch,
  declineMatch,
};


// =========================================================
// Matchmaking -> cria Match direto ACTIVE
// =========================================================
async function createMatchFromMatchmaking({ guildId, channelId, authorId, opponentId }) {
  const token = await generateMatchToken();

  return prisma.match.create({
    data: {
      guildId,
      channelId,
      authorId,
      opponentId,
      token,
      status: "ACTIVE",
      acceptedAt: new Date(),
    },
  });
}

module.exports.createMatchFromMatchmaking = createMatchFromMatchmaking;
