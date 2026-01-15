/**
 * src/handlers/buttons/desafiarMenuButtons.js
 *
 * Pendência #8:
 * - desafiar_have -> redireciona para comando /confronto (legacy) ou abre modal escolher usuário
 * - desafiar_find -> redireciona para matchmaking (convite público)
 */

const { MessageFlags } = require("discord.js");
const { createMatchmakingInvite } = require("../../services/matchmakingService");

async function handleDesafiarMenuButtons(client, interaction) {
  if (interaction.customId === "desafiar_have") {
    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "✅ Ok! Use o comando de confronto direto (integração do modal de alvo será adicionada em breve).",
    });
  }

  if (interaction.customId === "desafiar_find") {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Convite de procura criado no canal!" });
    await createMatchmakingInvite({ interaction });
    return;
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Botão inválido." });
}

module.exports = { handleDesafiarMenuButtons };
