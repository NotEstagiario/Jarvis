// src/index.js

// ========================================================
// Jarvis - Ponto de entrada
// ATENÇÃO: este arquivo controla boot do bot.
// Mexer aqui sem saber pode impedir o bot de ligar.
// ========================================================

require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const logger = require("./core/logger");
const botConfig = require("./config/bot");
const { applySchema } = require("./database/sqlite");

const readyEvent = require("./events/ready");
const interactionCreateEvent = require("./events/interactionCreate");

// ========================================================
// Boot Sequence
// 1) Validar env
// 2) Aplicar DB schema
// 3) Iniciar Discord Client
// ========================================================

if (!process.env.DISCORD_TOKEN) {
  logger.error("DISCORD_TOKEN não definido no .env");
  process.exit(1);
}

logger.info(`Iniciando ${botConfig.name} — ${botConfig.version}...`);

try {
  applySchema();
} catch (err) {
  logger.error("Falha ao aplicar schema do banco.", err);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => readyEvent(client));
client.on("interactionCreate", (interaction) => interactionCreateEvent(interaction));

client.login(process.env.DISCORD_TOKEN);
