// src/events/ready.js

// ========================================================
// Evento READY
// Dispara quando o bot está online.
// ========================================================

const logger = require("../core/logger");
const botConfig = require("../config/bot");

module.exports = (client) => {
  logger.info(`✅ ${botConfig.name} ONLINE — ${botConfig.version} ${botConfig.signature}`);
  logger.info(`Logado como: ${client.user.tag}`);
};
