// src/loaders/commandLoader.js

// ========================================================
// Command Loader - Jarvis
// Carrega automaticamente comandos da pasta src/commands
//
// ⚠️ CRÍTICO:
// - Cada arquivo deve exportar: { data, execute }
// - data = SlashCommandBuilder()
// - execute(interaction)
//
// ========================================================

const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");

function listCommandFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listCommandFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadCommands() {
  const commands = new Map();
  const commandsPath = path.join(__dirname, "..", "commands");

  if (!fs.existsSync(commandsPath)) {
    logger.warn("Pasta src/commands não encontrada. Nenhum comando carregado.");
    return commands;
  }

  const files = listCommandFiles(commandsPath);

  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const command = require(file);

      if (!command?.data || !command?.execute) {
        logger.warn(`Comando inválido: ${file} (faltando data/execute)`);
        continue;
      }

      const name = command.data.name;
      commands.set(name, command);
      logger.info(`Comando carregado: /${name}`);
    } catch (err) {
      logger.error(`Falha ao carregar comando: ${file}`, err);
    }
  }

  return commands;
}

module.exports = {
  loadCommands,
};
