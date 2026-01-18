// src/core/interactionRouter/selectMenus.router.js

const logger = require("../logger");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");

// DEBUG anti-spam
const DEBUG_SELECTMENUS = String(process.env.DEBUG_SELECTMENUS || "").toLowerCase() === "true";

async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
    return interaction.reply(payload);
  } catch {
    logger.warn("Falha em safeReply no selectMenus.router (ignorado).");
  }
}

module.exports = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const { customId } = interaction;
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  if (DEBUG_SELECTMENUS) {
    logger.info(`[SELECT] ${customId} por ${interaction.user.tag} (${userId})`);
  }

  try {
    // ========================================================
    // /editarperfil — BADGES SELECT
    // ========================================================
    if (customId === "editprofile_badges_select") {
      const { handleBadgesSelect } = require("../../modules/staff/profileEditor/profileEditor.badges");
      return handleBadgesSelect(interaction);
    }

    // ========================================================
    // 🆕 /editarperfil — RANK SELECT
    // ========================================================
    if (customId === "editprofile_rank_select") {
      const { handleRankSelect } = require("../../modules/staff/profileEditor/profileEditor.rank");
      return handleRankSelect(interaction);
    }

    return safeReply(interaction, {
      ephemeral: true,
      content: lang === "en-US" ? "⚠️ Unknown menu." : "⚠️ Menu desconhecido.",
    });
  } catch (err) {
    logger.error("Erro no selectMenus.router", err);

    return safeReply(interaction, {
      ephemeral: true,
      content: t(lang, "COMMON_ERROR_GENERIC"),
    });
  }
};
