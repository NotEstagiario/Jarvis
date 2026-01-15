/**
 * src/handlers/buttons/matchmakingInviteButtons.js
 *
 * Botões do convite público:
 * - mm_accept
 * - mm_cancel
 */

const { MessageFlags } = require("discord.js");
const { acceptInvite, cancelInvite } = require("../../services/matchmakingService");

async function handleMatchmakingInviteButtons(client, interaction) {
  const parts = interaction.customId.split(":");
  const action = parts[0];
  const inviteId = parts[1];

  if (action === "mm_cancel") {
    const ownerId = parts[2];
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Apenas o autor pode cancelar." });
    }
    const res = await cancelInvite({ inviteId, userId: interaction.user.id });
    if (!res.ok) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Não foi possível cancelar." });
    return interaction.update({ components: [], content: "❌ Procura cancelada.", embeds: interaction.message.embeds });
  }

  if (action === "mm_accept") {
    const res = await acceptInvite({ inviteId, accepterId: interaction.user.id });
    if (!res.ok) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Não foi possível aceitar." });

    return interaction.update({ components: [], content: "✅ Confronto criado! Agora a partida está ATIVA.", embeds: interaction.message.embeds });
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Ação inválida." });
}

module.exports = { handleMatchmakingInviteButtons };
