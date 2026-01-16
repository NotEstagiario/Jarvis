// src/core/interactionRouter/commands.router.js

// ========================================================
// Commands Router
// Executa comandos carregados em memória no client.
//
// ⚠️ CRÍTICO:
// - interação sem command => erro controlado
// ========================================================

const logger = require("../logger");

module.exports = async (interaction) => {
  const command = interaction.client.commands?.get(interaction.commandName);

  if (!command) {
    logger.warn(`Comando não encontrado: /${interaction.commandName}`);
    return interaction.reply({
      content: "⚠️ Esse comando não existe (ainda).",
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`Erro executando /${interaction.commandName}`, err);

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "⚠️ Ocorreu um erro interno ao executar esse comando.",
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: "⚠️ Ocorreu um erro interno ao executar esse comando.",
      ephemeral: true,
    });
  }
};
