// src/core/interactionRouter/modals.router.js

const logger = require("../logger");

const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");

async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
    return interaction.reply(payload);
  } catch {
    logger.warn("Falha em safeReply no modals.router (ignorado).");
  }
}

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const { customId } = interaction;
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  try {
    // ========================================================
    // /desafiar (v2.0)
    // ========================================================
    if (customId === "modal_challenge_opponent") {
      const { handleOpponentModal } = require("../../modules/competitive/matches/match.ui");
      return handleOpponentModal(interaction);
    }

    // ========================================================
    // /editarperfil (modals)
    // ========================================================
    if (customId.startsWith("editprofile_")) {
      const { MODAL } = require("../../modules/staff/profileEditor/profileEditor.constants");

      const { getState } = require("../../modules/staff/profileEditor/profileEditor.state");
      const st = getState(userId);

      if (!st?.targetId) {
        return safeReply(interaction, {
          ephemeral: true,
          content:
            lang === "en-US"
              ? "⚠️ Your editor session expired. Run /editarperfil again."
              : "⚠️ Sua sessão do editor expirou. Use /editarperfil novamente.",
        });
      }

      // Modals gerais do editor
      const { handleModalSetCustom, handleModalJustify } = require("../../modules/staff/profileEditor/profileEditor.ui");
      if (customId === MODAL.SET_CUSTOM) return handleModalSetCustom(interaction);
      if (customId === MODAL.JUSTIFY) return handleModalJustify(interaction);

      // Rivalries flow (modals)
      const {
        handlePickUserModalSubmit,
        handleNemesisValueModalSubmit,
        handleFavoriteValueModalSubmit,
        handleBestWinForModalSubmit,
        handleBestWinAgainstModalSubmit,
      } = require("../../modules/staff/profileEditor/profileEditor.rivalries");

      if (customId === MODAL.RIVALRIES_PICK_USER) return handlePickUserModalSubmit(interaction);
      if (customId === MODAL.RIVALRIES_NEMESIS_VALUE) return handleNemesisValueModalSubmit(interaction);
      if (customId === MODAL.RIVALRIES_FAVORITE_VALUE) return handleFavoriteValueModalSubmit(interaction);
      if (customId === MODAL.RIVALRIES_BESTWIN_FOR) return handleBestWinForModalSubmit(interaction);
      if (customId === MODAL.RIVALRIES_BESTWIN_AGAINST) return handleBestWinAgainstModalSubmit(interaction);

      return safeReply(interaction, {
        ephemeral: true,
        content: lang === "en-US" ? "⚠️ Unknown modal." : "⚠️ Modal desconhecido.",
      });
    }

    // ========================================================
    // Modal desconhecido
    // ========================================================
    return safeReply(interaction, {
      ephemeral: true,
      content: lang === "en-US" ? "⚠️ Unknown modal." : "⚠️ Modal desconhecido.",
    });
  } catch (err) {
    logger.error("Erro no modals.router", err);

    return safeReply(interaction, {
      ephemeral: true,
      content: t(lang, "COMMON_ERROR_GENERIC"),
    });
  }
};
