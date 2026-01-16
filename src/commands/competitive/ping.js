// src/commands/competitive/ping.js

// ========================================================
// /ping
// Comando de teste: valida se comandos estão carregando e executando.
// ========================================================

const { SlashCommandBuilder } = require("discord.js");
const botConfig = require("../../config/bot");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Teste de funcionamento do Jarvis (Alfa)"),

  async execute(interaction) {
    return interaction.reply({
      content: `🏓 Pong! ${botConfig.name} ${botConfig.version} ${botConfig.signature}`,
      ephemeral: true,
    });
  },
};
