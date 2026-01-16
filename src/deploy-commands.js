// src/deploy-commands.js

// ========================================================
// Deploy de Slash Commands - Jarvis
//
// Uso:
// node src/deploy-commands.js         -> registra comandos do Jarvis
// node src/deploy-commands.js --clear -> LIMPA comandos existentes
//
// ⚠️ CRÍTICO:
// Este arquivo altera comandos no Discord.
// ========================================================

require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { loadCommands } = require("./loaders/commandLoader");
const logger = require("./core/logger");

const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  logger.error("Variáveis do .env faltando: DISCORD_TOKEN / CLIENT_ID / GUILD_ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function main() {
  if (shouldClear) {
    logger.warn("LIMPANDO comandos do servidor (GUILD)...");
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: [],
    });
    logger.info("✅ Comandos antigos removidos com sucesso.");
    return;
  }

  const loaded = loadCommands();
  const commandsData = Array.from(loaded.values()).map((cmd) => cmd.data.toJSON());

  logger.info(`Deployando ${commandsData.length} comando(s) no servidor...`);

  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
    body: commandsData,
  });

  logger.info("✅ Deploy concluído com sucesso.");
}

main().catch((err) => {
  logger.error("Falha no deploy.", err);
  process.exit(1);
});
