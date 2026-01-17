// src/modules/competitive/matches/match.constants.js

// ========================================================
// Competitive Matches - Constants (v2.0)
// ========================================================

const MATCH_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  FINISHED_OK: "finished_ok",
  FINISHED_VOID: "finished_void",
  PENDING_RESULT: "pending_result",
  PENDING_REVIEW: "pending_review",
};

const LOCK_TYPES = {
  // match running
  ACTIVE: "active",

  // future systems
  SEARCHING: "searching",
  PENDING_RESULT: "pending_result",
  PENDING_REVIEW: "pending_review",

  // v2.0 challenge flow locks
  PENDING_MENU: "pending_menu", // abriu menu inicial (/desafiar)
  PENDING_SETUP: "pending_setup", // clicou "já tenho adversário" / "search" / aguardando @
  PENDING_CONFIRM: "pending_confirm", // já escolheu adversário e está na tela Confirmar/Cancelar
  PENDING_INVITE: "pending_invite", // convite enviado, aguardando aceitar/recusar
};

const MATCH_TIMERS = {
  // 30 min para registrar /resultado
  MATCH_EXPIRES_MINUTES: 30,
  // convite procurar adversário (v2.0.1)
  SEARCH_EXPIRES_MINUTES: 10,
  // confirmação do adversário no /resultado
  RESULT_CONFIRM_MINUTES: 10,
};

module.exports = {
  MATCH_STATUS,
  LOCK_TYPES,
  MATCH_TIMERS,
};
