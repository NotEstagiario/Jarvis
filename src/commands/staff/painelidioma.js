// src/commands/staff/painelidioma.js

// ========================================================
// /painelidioma (STAFF)
// Posta o painel fixo do idioma no canal correto.
// ========================================================

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const azyron = require("../../config/azyronIds");
const logger = require("../../core/logger");
const { buildLanguagePanel } = require("../../modules/global/language/language.panel");

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

function hasStaffRole(member) {
  const staffRoleId = azyron.roles.staff;
  if (!staffRoleId) return false;
  return member?.roles?.cache?.has(staffRoleId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("painelidioma")
    .setDescription("Posta o painel fixo de idioma (Staff)"),

  async execute(interaction) {
    logger.info(`[CMD] /painelidioma por ${interaction.user.tag} (${interaction.user.id})`);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!isPresident(interaction.user.id) && !hasStaffRole(interaction.member)) {
      return interaction.editReply({ content: "⛔ Você não tem permissão para usar este comando." });
    }

    const channelId = azyron.channels.language;
    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      return interaction.editReply({
        content: `❌ Canal de idioma não encontrado: ${channelId}`,
      });
    }

    const panel = buildLanguagePanel();
    await channel.send(panel);

    return interaction.editReply({ content: "✅ Painel de idioma postado com sucesso." });
  },
};
