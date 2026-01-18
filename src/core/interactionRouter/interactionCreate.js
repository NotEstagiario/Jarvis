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
const selectMenusRouter = require("./selectMenus.router"); // ✅ SELECT MENUS ROUTER

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

    // outros tipos ignorados
    return;
  } catch (err) {
    const code = err?.code;

    // ✅ FIX DEFINITIVO:
    // 10062 = Unknown interaction (expirada)
    // 40060 = Interaction already acknowledged (reply/defer duplicado)
    // -> NÃO logar como erro e NÃO tentar responder
    if (code === 10062 || code === 40060) return;

    logger.error("Erro no router de interações.", err);

    // ✅ Nunca deixar interaction morrer sem resposta (quando ainda possível)
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
