const { MessageFlags } = require("discord.js");

async function PLACEHOLDER(client, interaction) {
  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "⚠️ Handler de botões ainda em migração." });
}

module.exports = { handleMatchmakingButtons: PLACEHOLDER };
