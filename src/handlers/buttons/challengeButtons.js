/**
 * src/handlers/buttons/challengeButtons.js
 *
 * =========================================================
 * ✅ BOTÕES: Pedido de Confronto (accept/decline)
 * =========================================================
 */

const { MessageFlags, EmbedBuilder } = require("discord.js");
const { acceptMatch, declineMatch } = require("../../services/matchService");
const { EMBED_FOOTER } = require("../../config/constants");

async function handleChallengeButtons(client, interaction) {
  const [action, matchId] = interaction.customId.split(":");

  if (!matchId) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Match inválido." });
  }

  if (action === "challenge_accept") {
    try {
      const match = await acceptMatch({
        guildId: interaction.guildId,
        matchId,
        accepterId: interaction.user.id,
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Confronto Aceito!")
        .setColor(0x22c55e)
        .setDescription(
          `Jogador: <@${match.authorId}>\nAdversário: <@${match.opponentId}>\n\nToken: \`${match.token || match.id}\``
        )
        .setFooter({ text: EMBED_FOOTER });

      return interaction.update({ embeds: [embed], components: [] });
    } catch (err) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: `❌ Não foi possível aceitar: ${err.message || "erro"}` });
    }
  }

  if (action === "challenge_decline") {
    try {
      const match = await declineMatch({
        guildId: interaction.guildId,
        matchId,
        declinerId: interaction.user.id,
      });

      const embed = new EmbedBuilder()
        .setTitle("❌ Confronto Recusado")
        .setColor(0xef4444)
        .setDescription(
          `Jogador: <@${match.authorId}>\nAdversário: <@${match.opponentId}>\n\nToken: \`${match.token || match.id}\``
        )
        .setFooter({ text: EMBED_FOOTER });

      return interaction.update({ embeds: [embed], components: [] });
    } catch (err) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: `❌ Não foi possível recusar: ${err.message || "erro"}` });
    }
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "⚠️ Botão de desafio não reconhecido." });
}

module.exports = { handleChallengeButtons };
