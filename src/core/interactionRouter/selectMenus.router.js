// src/core/interactionRouter/selectMenus.router.js

const logger = require("../logger");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");

// DEBUG anti-spam
const DEBUG_SELECTMENUS = String(process.env.DEBUG_SELECTMENUS || "").toLowerCase() === "true";

// ========================================================
// ✅ ACK IMEDIATO (select menus)
// - 10062 acontece quando passa do tempo (~3s)
// - então router SEMPRE dá deferUpdate antes de qualquer await pesado
// - handlers NÃO devem deferUpdate nem reply
// ========================================================
async function safeDeferUpdate(interaction) {
  try {
    if (interaction.deferred || interaction.replied) return true;
    await interaction.deferUpdate();
    return true;
  } catch (err) {
    const code = err?.code;

    if (code === 10062) {
      logger.warn("SelectMenu: interaction expirada (10062). Ignorando.");
      return false;
    }

    if (code === 40060) {
      // Interaction already acknowledged
      return true;
    }

    logger.warn("Falha em deferUpdate() no selectMenus.router.", err);
    return false;
  }
}

// ========================================================
// depois do deferUpdate, sempre editReply (quando precisar)
// ========================================================
async function safeEditReply(interaction, payload) {
  try {
    return await interaction.editReply(payload);
  } catch (err) {
    const code = err?.code;

    if (code === 10062 || code === 40060) return null;

    try {
      return await interaction.followUp({ ...payload, ephemeral: true });
    } catch {
      return null;
    }
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

  // ✅ ACK IMEDIATO
  const ackOk = await safeDeferUpdate(interaction);
  if (!ackOk) return;

  try {
    // ========================================================
    // /editarperfil — BADGES SELECT
    // ========================================================
    if (customId === "editprofile_badges_select") {
      const { handleBadgesSelect } = require("../../modules/staff/profileEditor/profileEditor.badges");
      return handleBadgesSelect(interaction);
    }

    // ========================================================
    // /editarperfil — RANK SELECT
    // ========================================================
    if (customId === "editprofile_rank_select") {
      const { handleRankSelect } = require("../../modules/staff/profileEditor/profileEditor.rank");
      return handleRankSelect(interaction);
    }

    // menu desconhecido
    return safeEditReply(interaction, {
      components: [],
      embeds: [],
      content: lang === "en-US" ? "⚠️ Unknown menu." : "⚠️ Menu desconhecido.",
    });
  } catch (err) {
    const code = err?.code;
    if (code === 10062 || code === 40060) return;

    logger.error("Erro no selectMenus.router", err);

    return safeEditReply(interaction, {
      content: t(lang, "COMMON_ERROR_GENERIC"),
      components: [],
      embeds: [],
    });
  }
};
