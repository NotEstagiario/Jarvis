// src/core/interactionRouter/modals.router.js

// ========================================================
// Modals Router (GLOBAL)
//
// Aqui ficam TODOS os handlers de modais do bot.
// REGRA DO PROJETO:
// - Nunca travar a interaction
// - Sempre responder (ou followUp)
// - Logs claros para debug
// ========================================================

const logger = require("../logger");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const { customId } = interaction;
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  try {
    // ========================================================
    // /desafiar -> modal adversário (v2.0 - legado)
    // ========================================================
    if (customId === "modal_challenge_opponent") {
      const { handleOpponentModal } = require("../../modules/competitive/matches/match.ui");
      return handleOpponentModal(interaction);
    }

    return interaction.reply({
      ephemeral: true,
      content: lang === "en-US" ? "⚠️ Unknown modal." : "⚠️ Modal desconhecido.",
    });
  } catch (err) {
    logger.error("Erro no modals.router", err);
    return interaction.reply({
      ephemeral: true,
      content: t(lang, "COMMON_ERROR_GENERIC"),
    });
  }
};
