// src/index.js

// ========================================================
// Jarvis - Ponto de entrada
// ATENÇÃO: este arquivo controla boot do bot.
// ========================================================

require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const logger = require("./core/logger");
const botConfig = require("./config/bot");
const { applySchema } = require("./database/sqlite");
const { loadCommands } = require("./loaders/commandLoader");

// Eventos
const readyEvent = require("./events/ready");
const interactionCreateEvent = require("./events/interactionCreate");

// ========================================================
// Versão do bot (Word)
// ========================================================
const JARVIS_VERSION = "1.4";

// ========================================================
// Captura de erros globais (evita "clean exit" silencioso)
// ========================================================

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection detectada.", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception detectada.", err);
});

// ========================================================
// Validação ENV
// ========================================================

if (!process.env.DISCORD_TOKEN) {
  logger.error("DISCORD_TOKEN não definido no .env");
  process.exit(1);
}

logger.info("===============================================");
logger.info(`🤖 ${botConfig.name} iniciando...`);
logger.info(`📌 Versão atual: ${JARVIS_VERSION}`);
logger.info("===============================================");

// ========================================================
// Banco SQLite
// ========================================================

try {
  applySchema();
} catch (err) {
  logger.error("Falha ao aplicar schema do banco.", err);
  process.exit(1);
}

// ========================================================
// Discord Client
// ========================================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ========================================================
// Commands
// ========================================================

client.commands = loadCommands();

// ========================================================
// Eventos
// ========================================================

// ⚠️ v14 ok, mas v15 muda para clientReady
client.once("ready", () => readyEvent(client));
client.on("interactionCreate", (interaction) => interactionCreateEvent(interaction));

// ========================================================
// Login (COM try/catch e log explícito)
// ========================================================

(async () => {
  try {
    logger.info("🔐 Tentando logar no Discord...");
    await client.login(process.env.DISCORD_TOKEN);
    logger.info("✅ Login iniciado (aguardando ready)...");
  } catch (err) {
    logger.error("❌ Falha ao logar no Discord (token errado ou erro de conexão).", err);
    process.exit(1);
  }
})();
