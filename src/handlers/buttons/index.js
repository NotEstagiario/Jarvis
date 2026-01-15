/**
 * src/handlers/buttons/index.js
 *
 * Centraliza o roteamento de botões.
 * Mantém o interactionCreate limpo.
 */

const { MessageFlags } = require("discord.js");

const { handleChallengeButtons } = require("./challengeButtons");
const { handleMatchmakingButtons } = require("./matchmakingButtons");
const { handleResultWizardButtons } = require("./resultWizardButtons");
const { handleCancelButtons } = require("./cancelButtons");
const { handlePanelsButtons } = require("./panelsButtons");

async function handleButtonInteraction(client, interaction) {
  try {
    const id = interaction.customId;

    // Painéis (idioma/gameplay)
    if (id.startsWith("lang_pick_") || id.startsWith("gameplay_pick_")) {
      return handlePanelsButtons(client, interaction);
    }

    // Desafios
    if (id.startsWith("challenge_accept:") || id.startsWith("challenge_decline:")) {
      return handleChallengeButtons(client, interaction);
    }

    // Matchmaking
    if (id.startsWith("mm_") || id.startsWith("invite_") || id.startsWith("filter_")) {
      return handleMatchmakingButtons(client, interaction);
    }

    // Resultado wizard
    if (id.startsWith("rw_") || id.startsWith("result_")) {
      return handleResultWizardButtons(client, interaction);
    }

    // Cancelamento
    if (id.startsWith("cancel_") || id.startsWith("staff-cancel") || id.startsWith("staff_cancel")) {
      return handleCancelButtons(client, interaction);
    }

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "⚠️ Botão não reconhecido.",
    });
  } catch (err) {
    console.error("[buttons] error:", err);
    if (interaction.isRepliable() && !interaction.replied) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Erro interno." }).catch(() => {});
    }
  }
}

module.exports = { handleButtonInteraction };
