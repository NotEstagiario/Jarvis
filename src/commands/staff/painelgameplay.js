// src/commands/staff/painelgameplay.js

// ========================================================
// /painelgameplay (STAFF)
//
// REGRA DO WORD:
// - Serve como fallback para repostar o painel fixo
// - Normalmente o bot já faz auto-post no ready()
// - Apenas staff pode usar
//
// Ação:
// - Posta o painel Gameplay Style no canal `channels.style`
// ========================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { buildGameplayPanel } = require("../../modules/global/gameplay/gameplay.panel");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("painelgameplay")
    .setDescription("Posta o painel fixo do estilo de jogo (Competitivo/Casual) (Staff)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // sempre evitar timeout
    await interaction.deferReply({ ephemeral: true });

    try {
      const channelId = azyron.channels.style;
      const channel = await interaction.client.channels.fetch(channelId).catch(() => null);

      if (!channel) {
        return interaction.editReply({
          content: "⚠️ Canal de estilo não encontrado. Verifique o azyronIds.js",
        });
      }

      await channel.send(buildGameplayPanel());

      logger.info(`[STAFF] Painel gameplay repostado por ${interaction.user.tag} (${interaction.user.id})`);

      return interaction.editReply({
        content: "✅ Painel de gameplay postado com sucesso.",
      });
    } catch (err) {
      logger.error("Erro no /painelgameplay", err);
      return interaction.editReply({
        content: "⚠️ Ocorreu um erro ao postar o painel de gameplay.",
      });
    }
  },
};
