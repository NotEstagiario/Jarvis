// src/index.js

// ========================================================
// Jarvis - Ponto de entrada
// ATENÇÃO: este arquivo controla boot do bot.
// Mexer aqui sem saber pode impedir o bot de ligar.
//
// Sequência de Boot:
// 1) Carregar env
// 2) Aplicar DB schema
// 3) Carregar comandos
// 4) Iniciar Discord Client
// ========================================================

require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const logger = require("./core/logger");
const botConfig = require("./config/bot");
const { applySchema } = require("./database/sqlite");

// 🧠 Loader de comandos
const { loadCommands } = require("./loaders/commandLoader");

// Eventos
const readyEvent = require("./events/ready");
const interactionCreateEvent = require("./events/interactionCreate");

// ========================================================
// Validação de ENV
// ========================================================

if (!process.env.DISCORD_TOKEN) {
  logger.error("DISCORD_TOKEN não definido no .env");
  process.exit(1);
}

// ========================================================
// Inicialização do Jarvis
// ========================================================

logger.info(`Iniciando ${botConfig.name} — ${botConfig.version}...`);

// ========================================================
// Banco de Dados (SQLite)
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
// Carregar comandos na memória do bot
// ========================================================

client.commands = loadCommands();

logger.info(`Comandos carregados: ${client.commands.size}`);
if (client.commands.size > 0) {
  const list = Array.from(client.commands.keys()).map((n) => `/${n}`).join(", ");
  logger.info(`Lista: ${list}`);
}

// ========================================================
// Eventos
// ========================================================

client.once("ready", () => readyEvent(client));
client.on("interactionCreate", (interaction) => interactionCreateEvent(interaction));

// ========================================================
// Login
// ========================================================

client.login(process.env.DISCORD_TOKEN);
