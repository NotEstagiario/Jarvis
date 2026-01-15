/**
 * src/services/staffReviewService.js
 *
 * [CRITICAL][STAFF]
 * Creates staff review messages with buttons for confirm/deny/edit.
 * This is used for:
 * - Opponent denial
 * - Opponent timeout
 * - WO requests (future)
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_FOOTER } = require("../config/constants");

function buildStaffReviewEmbed({ title, reason, authorId, opponentId, homeScore, awayScore, resultId, justification }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `**Motivo:** ${reason}
` +
      `**Autor:** <@${authorId}>
` +
      `**Adversário:** <@${opponentId}>
` +
      `**Placar sugerido:** **${homeScore} x ${awayScore}**
` +
      (justification ? `
**Justificativa:**
> ${justification}` : "") +
      `

ResultID: \`${resultId}\``
    )
    .setColor(0xf97316)
    .setFooter({ text: EMBED_FOOTER })
    .setTimestamp(new Date());
}

function buildStaffReviewButtons(resultId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`staff_result_confirm:${resultId}`).setLabel("Confirmar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`staff_result_deny:${resultId}`).setLabel("Negar").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`staff_result_edit:${resultId}`).setLabel("Editar placar").setStyle(ButtonStyle.Secondary),
  );
}

module.exports = { buildStaffReviewEmbed, buildStaffReviewButtons };


// ------------------------------------------------------------
// BUILDER (STAFF REVIEW) - usado por TIMEOUT e recusas
// ------------------------------------------------------------

async function buildStaffReviewEmbedWithButtons(resultId, reason) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const result = await prisma.result.findUnique({ where: { id: resultId } });
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Staff Review - Resultado')
    .setDescription([
      `Motivo: **${reason}**`,
      `Autor: <@${result.authorId}>`,
      `Oponente: <@${result.opponentId}>`,
      `Placar sugerido: **${result.homeScore} x ${result.awayScore}**`,
      `Match: **${result.matchId}**`,
    ].join('\n'))
    .setColor(0xffaa00);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`staff_confirm:${resultId}`).setLabel('Confirmar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`staff_deny:${resultId}`).setLabel('Negar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`staff_edit:${resultId}`).setLabel('Editar placar').setStyle(ButtonStyle.Secondary),
  );

  return { embed, components: [row] };
}

module.exports.buildStaffReviewEmbedWithButtons = buildStaffReviewEmbedWithButtons;
