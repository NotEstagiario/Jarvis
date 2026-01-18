// src/commands/staff/resetar.js

const { SlashCommandBuilder } = require("discord.js");

const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");
const { isAdminWord } = require("../../utils/admin");

const { repostResetPanel } = require("../../modules/staff/resetar/resetar.panel");
const azyron = require("../../config/azyronIds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetar")
    .setDescription("Reposta o painel fixo da Central de Reset (Staff)."),

  async execute(interaction) {
    const userId = interaction.user.id;
    const lang = getUserLang(userId);

    const allowed = isAdminWord(interaction.member, userId);
    if (!allowed) {
      return interaction.reply({
        ephemeral: true,
        content: t(lang, "EDITOR_ONLY_STAFF"),
      });
    }

    if (String(interaction.channelId) !== String(azyron.channels.resetar)) {
      return interaction.reply({
        ephemeral: true,
        content:
          lang === "en-US"
            ? `⚠️ Use this command in <#${azyron.channels.resetar}>.`
            : `⚠️ Use este comando em <#${azyron.channels.resetar}>.`,
      });
    }

    await interaction.reply({
      ephemeral: true,
      content: lang === "en-US" ? "✅ Reposting reset panel..." : "✅ Repostando painel de reset...",
    });

    await repostResetPanel(interaction.client);

    return interaction.followUp({
      ephemeral: true,
      content: lang === "en-US" ? "✅ Done." : "✅ Feito.",
    });
  },
};
