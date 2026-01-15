/**
 * src/handlers/modals/index.js
 *
 * Centraliza o roteamento de modais.
 */

const { MessageFlags } = require("discord.js");

const { handleChallengeModals } = require("./challengeModals");
const { handleCancelModals } = require("./cancelModals");
const { handleResetStatsModals } = require("./resetStatsModals");

async function handleModalSubmit(client, interaction) {
  try {
    const id = interaction.customId;

    if (id === "desafiar_direct_modal") return handleChallengeModals(client, interaction);
    if (id === "cancel_modal" || id.startsWith("cancel_")) return handleCancelModals(client, interaction);
    if (id.startsWith("resetstats_modal:")) return handleResetStatsModals(client, interaction);
    if (id.startsWith("staff_cancel_match:")) return require('./staffCancelMatchModals').handleStaffCancelMatchModals(client, interaction);
    if (id.startsWith("wo_reason:")) return require('./woModals').handleWoModals(client, interaction);
    if (id.startsWith("wo_edit:")) return require('./woEditModals').handleWoEditModals(client, interaction);
    if (id.startsWith("rw_opp_deny_modal:")) return require("./resultWizardModals").handleResultWizardModals(client, interaction);

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "⚠️ Modal não reconhecido.",
    });
  } catch (err) {
    console.error("[modals] error:", err);
    if (interaction.isRepliable() && !interaction.replied) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Erro interno." }).catch(() => {});
    }
  }
}

module.exports = { handleModalSubmit };
