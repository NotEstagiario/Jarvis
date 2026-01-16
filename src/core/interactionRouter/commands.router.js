// src/core/interactionRouter/commands.router.js

// ========================================================
// Router de Commands
// Aqui iremos carregar e executar /commands.
// ========================================================

module.exports = async (interaction) => {
  // Por enquanto só loga.
  await interaction.reply({
    content: "✅ Jarvis Alfa 0.2 ativo. (Commands ainda não implementados)",
    ephemeral: true,
  });
};
