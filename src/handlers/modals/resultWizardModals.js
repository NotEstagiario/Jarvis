/**
 * src/handlers/modals/resultWizardModals.js
 *
 * =========================================================
 * ✅ MODAL: Recusa de resultado pelo adversário
 * =========================================================
 * CustomId:
 * - rw_opp_deny_modal:<resultId>
 *
 * Salva justificativa e marca status DISPUTED para staff.
 */

const { MessageFlags, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { STAFF_LOG_CHANNEL_ID, EMBED_FOOTER } = require("../../config/constants");

async function handleResultWizardModals(client, interaction) {
  const [, resultId] = interaction.customId.split(":");
  const reason = interaction.fields.getTextInputValue("reason");

  const result = await prisma.result.update({
    where: { id: resultId },
    data: { status: "DISPUTED", opponentReason: reason },
  }).catch(()=>null);

  if (!result) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Resultado inválido." });
  }

  // Staff log
  const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Resultado recusado (Disputa)")
      .setColor(0xef4444)
      .setDescription(
        `**Autor:** <@${result.authorId}>\n` +
        `**Oponente:** <@${result.opponentId}>\n` +
        `**Placar:** ${result.homeScore}x${result.awayScore}\n` +
        `**ResultId:** \`${resultId}\`\n\n` +
        `**Justificativa da recusa:**\n> ${reason}`
      )
      .setFooter({ text: EMBED_FOOTER });

    await logChannel.send({ embeds: [embed] }).catch(()=>{});
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Recusa registrada. Staff foi notificada." });
}

module.exports = { handleResultWizardModals };
