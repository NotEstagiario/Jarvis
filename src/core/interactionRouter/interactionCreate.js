// src/core/interactionRouter/interactionCreate.js

// ========================================================
// Router principal de Interactions
// Regras:
// - NÃO colocar lógica de comando aqui.
// - Apenas encaminhar para handlers específicos.
// ========================================================

const logger = require("../logger");

const commandsRouter = require("./commands.router");
const buttonsRouter = require("./buttons.router");
const modalsRouter = require("./modals.router");
const selectMenusRouter = require("./selectMenus.router"); // ✅ FALTAVA ISSO

module.exports = async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      return commandsRouter(interaction);
    }

    if (interaction.isButton()) {
      return buttonsRouter(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return selectMenusRouter(interaction);
    }

    if (interaction.isModalSubmit()) {
      return modalsRouter(interaction);
    }
  } catch (err) {
    logger.error("Erro no router de interações.", err);

    // ✅ Nunca deixar interaction morrer sem resposta
    try {
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          content: "⚠️ Ocorreu um erro interno ao processar sua interação.",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: "⚠️ Ocorreu um erro interno ao processar sua interação.",
        ephemeral: true,
      });
    } catch {
      // silêncio absoluto se até isso falhar
    }
  }
};
