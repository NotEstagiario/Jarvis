/**
 * src/config/constants.js
 *
 * [CRITICAL]
 * This file centralizes server-specific configuration and core constants.
 * Changing IDs or bypass rules incorrectly can break permissions and allow abuse.
 */

module.exports = {
  // [OWNER] Absolute owner (bypass ALL restrictions, cooldowns and role checks).
  OWNER_ID: "344322996351270914",

  // Staff roles (exclusive to your Discord server).
  STAFF_ROLES: {
    PRESIDENT: "1428646577014177875",
    VICE_PRESIDENTS: "1453144013795491930",
    COUNCIL: "1460338237120708881",
  },

  // Gameplay roles
  GAMEPLAY_ROLES: {
    COMPETITIVE: "1457347614147215391",
    CASUAL: "1457362198216179961",
  },

  // Channel where gameplay selection embed must stay fixed
  GAMEPLAY_CHANNEL_ID: "1459817246766661724",

  // Channel where language selection embed must stay fixed
  LANGUAGE_CHANNEL_ID: "1460502122826174464",

  // Anti-farm staff alerts channel
  STAFF_LOG_CHANNEL_ID: "1459740381653504223",

  ALERTS_CHANNEL_ID: "1460858040864477349",

  // Global embed signature.
  EMBED_FOOTER: "👑 King N",

  // Command keys (used for bindings/cooldowns).
  COMMAND_KEYS: {
    DESAFIAR: "desafiar",
    REGISTRAR_RESULTADO: "registrarresultado",
    PERFIL: "perfil",
    CANCELAR: "cancelar",
    VERTOKEN: "vertoken",
    STAFFCANCELAR: "staffcancelar",
    VERPERFIL: "verperfil",
  },

  // Cooldowns (seconds)
  COOLDOWNS: {
    PERFIL_SECONDS: 30,
  },

  // Anti-farm thresholds
  ANTIFARM: {
    ALERT_DAILY_SAME_OPPONENT: 4,
    BLOCK_DAILY_SAME_OPPONENT: 6,
    ALERT_WEEKLY_SAME_OPPONENT_MIN: 10,
    ALERT_WEEKLY_SAME_OPPONENT_MAX: 12,
  },

  // Assets paths
  ASSETS: {
    RESULT_BANNER: "assets/banners/resultado_base.png",
    RESULT_FONT: "assets/fonts/Haettenschweiler-Regular.TTF",
  }
};
