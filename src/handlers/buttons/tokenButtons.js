/**
 * src/handlers/buttons/tokenButtons.js
 *
 * Botão "Copiar Token" (ephemeral) para staff.
 */

const { MessageFlags } = require("discord.js");

async function handleTokenButtons(interaction) {
  const [, token] = interaction.customId.split(":");
  return interaction.reply({ flags: MessageFlags.Ephemeral, content: `📌 Token: \`${token}\`` });
}

module.exports = { handleTokenButtons };
