/**
 * src/services/ownerOnlyService.js
 *
 * =========================================================
 *  👑 OWNER ONLY (King N)
 * =========================================================
 * [CRÍTICO]
 * - Comandos perigosos (editar/resetar stats) devem ser
 *   exclusivos do Owner para evitar abuso.
 */

const { MessageFlags } = require("discord.js");
const { isOwner } = require("./ownerService");

async function assertOwnerOnly(interaction) {
  if (isOwner(interaction.user.id)) return true;
  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: "🚫 Comando restrito ao Owner do servidor.",
  });
  return false;
}

module.exports = { assertOwnerOnly };
