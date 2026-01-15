/**
 * src/events/interactionCreate.js
 *
 * =========================================================
 * ✅ InteractionCreate (roteador principal de interações)
 * =========================================================
 * [CRÍTICO]
 * Este arquivo PRECISA ficar curto e organizado.
 * Toda lógica pesada deve ir para:
 * - src/handlers/buttons/
 * - src/handlers/modals/
 *
 * Assim evitamos erros de sintaxe e "arquivo monstro".
 */

const { MessageFlags } = require("discord.js");

// Handlers (separados por tipo)
const { handleButtonInteraction } = require("../handlers/buttons");
const { handleModalSubmit } = require("../handlers/modals");

module.exports = {
  name: "interactionCreate",

  async execute(client, interaction) {
    try {
      // =========================================================
      // 1) Slash Commands (executa command.execute)
      // =========================================================
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: "❌ Comando não encontrado.",
          });
        }

        return command.execute(client, interaction);
      }

      // =========================================================
      // 2) Botões
      // =========================================================
      if (interaction.isButton()) {
        return handleButtonInteraction(client, interaction);
      }

      // =========================================================
      // 3) Modais
      // =========================================================
      if (interaction.isModalSubmit()) {
        return handleModalSubmit(client, interaction);
      }

      return;
    } catch (err) {
      console.error("[interactionCreate] error:", err);

      // [SAFE] nunca deixar interaction failed
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction
          .reply({ flags: MessageFlags.Ephemeral, content: "❌ Erro interno." })
          .catch(() => {});
      }
    }
  },
};
