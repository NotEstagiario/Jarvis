// src/modules/staff/resetar/resetar.constants.js

const PANEL_KEY = "resetar";

// ========================================================
// Botões do painel (emoji-only)
// ========================================================
const BTN = {
  // painel principal
  OPEN_STATS: "resetar_open_stats", // 🧹
  OPEN_RANKS: "resetar_open_ranks", // 🏆 placeholder
  OPEN_SEASON: "resetar_open_season", // 📅 placeholder
  GLOBAL_ALL: "resetar_global_all", // 🌐 atalho total

  // submenu estatísticas
  STATS_INDIVIDUAL: "resetar_stats_individual",
  STATS_GLOBAL: "resetar_stats_global",

  BACK_HOME: "resetar_back_home",

  // decisão do presidente
  PRES_CONFIRM: "resetar_pres_confirm",
  PRES_DENY: "resetar_pres_deny",
};

const MODAL = {
  // estatísticas
  STATS_INDIVIDUAL: "resetar_modal_stats_individual", // targetId + justify
  STATS_GLOBAL: "resetar_modal_stats_global", // justify + password

  // global all
  GLOBAL_ALL: "resetar_modal_global_all", // justify + password
};

module.exports = {
  PANEL_KEY,
  BTN,
  MODAL,
};
