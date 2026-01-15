/**
 * src/commands/staff/verperfil.js
 *
 * [STAFF]
 * Placeholder in this update (services layer introduced).
 */

const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../../services/permissionService");
const { prisma } = require("../../prismaClient");

module.exports = {
  data: new SlashCommandBuilder().setName("verperfil").setDescription("Comando staff (placeholder)."),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ephemeral: true, content: "❌ Apenas staff." });
    }
    await prisma.player.upsert({
      where: { guildId_discordId: { guildId: interaction.guildId, discordId: interaction.user.id } },
      update: {},
      create: { guildId: interaction.guildId, discordId: interaction.user.id }
    });
    return interaction.reply({ ephemeral: true, content: "✅ OK (placeholder staff)." });
  }
};
