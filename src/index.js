// src/index.js

// ========================================================
// Jarvis - Ponto de entrada
// ATENÇÃO: este arquivo controla boot do bot.
// ========================================================

require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

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
// ⚠️ mantenha coerente com o release atual
const JARVIS_VERSION = "2.2";

// ========================================================
// Helpers - Ignorar erros "normais" do Discord
// ========================================================

function shouldIgnoreDiscordRejection(reason) {
  // reason pode vir como:
  // - DiscordAPIError
  // - RestError
  // - Error normal
  // - string
  const code = reason?.code;
  const message = String(reason?.message || reason || "");

  // ✅ erros comuns e "esperados" do Discord
  // 10062 = Unknown interaction (expirada)
  // 40060 = Interaction already acknowledged
  if (code === 10062 || code === 40060) return true;

  // fallback por texto
  if (message.includes("Unknown interaction")) return true;
  if (message.includes("Interaction has already been acknowledged")) return true;

  return false;
}

// ========================================================
// Captura de erros globais (evita "clean exit" silencioso)
// ========================================================

process.on("unhandledRejection", (reason) => {
  // ✅ FIX DEFINITIVO: não tratar 10062 / 40060 como erro fatal
  if (shouldIgnoreDiscordRejection(reason)) return;

  logger.error("Unhandled Rejection detectada.", reason);
});

process.on("uncaughtException", (err) => {
  // aqui NÃO deve ignorar, pois geralmente é bug real
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
//
// ⚠️ v2.0:
// /desafiar precisa ler messageCreate para capturar @ do adversário.
// ========================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,

    // ✅ necessário para message collectors (/desafiar)
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,

    // ✅ útil para roles/painéis
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// ========================================================
// Commands
// ========================================================

client.commands = loadCommands();

// ========================================================
// Eventos
// ========================================================

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
