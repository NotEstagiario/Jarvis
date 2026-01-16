// src/commands/competitive/idioma.js

// ========================================================
// /idioma
//
// ✅ Mostra o idioma atual do usuário e direciona pro painel.
// ========================================================

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const azyron = require("../../config/azyronIds");
const logger = require("../../core/logger");
const { getUserLanguage } = require("../../modules/global/language/language.service");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("idioma")
    .setDescription("Mostra e altera o idioma do bot (PT/EN)"),

  async execute(interaction) {
    logger.info(`[CMD] /idioma por ${interaction.user.tag} (${interaction.user.id})`);

    const lang = getUserLanguage(interaction.user.id);
    const channelId = azyron.channels.language;

    return interaction.reply({
      content:
        `🌐 Seu idioma atual é: **${lang}**\n` +
        `➡️ Para alterar, use o painel no canal <#${channelId}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
