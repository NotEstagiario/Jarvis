/**
 * src/services/cancelService.js
 *
 * [CRITICAL][INTEGRITY]
 * Handles match cancellation flow states.
 * This is a foundation; full opponent negotiation is done via interactions in interactionCreate.
 */

const { prisma } = require("../prismaClient");

async function cancelMatchById({ matchId }) {
  return prisma.match.update({
    where: { id: matchId },
    data: { status: "CANCELED", finishedAt: new Date() }
  });
}

module.exports = { cancelMatchById };
