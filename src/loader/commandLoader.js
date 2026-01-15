/**
 * src/loader/commandLoader.js
 *
 * Loads command modules from src/commands.
 */

const fs = require("node:fs");
const path = require("node:path");

function loadCommands() {
  const commands = new Map();
  const root = path.join(__dirname, "..", "commands");
  for (const folder of fs.readdirSync(root)) {
    const folderPath = path.join(root, folder);
    for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
      const cmd = require(path.join(folderPath, file));
      if (!cmd?.data?.name || !cmd.execute) continue;
      commands.set(cmd.data.name, cmd);
    }
  }
  return commands;
}

module.exports = { loadCommands };
