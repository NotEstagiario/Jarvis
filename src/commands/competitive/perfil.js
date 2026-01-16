// src/commands/competitive/perfil.js

// ========================================================
// /perfil (Competitivo)
//
// ⚠️ REGRA DO WORD:
// - /perfil mostra APENAS o perfil do autor (não escolhe usuário)
// - /analisarperfil é outro comando (staff) para ver perfil de terceiros
//
// ✅ Arquitetura:
// - i18n desde o início (SEM texto hardcoded)
// - DB via SQLite service
// - Código organizado e comentado
//
// ✅ Anti "The application did not respond":
// - SEMPRE usar deferReply({ ephemeral: true }) no início
//
// ⚠️ Anti-SPAM de terminal:
// - Logs só se DEBUG_COMMANDS=true no .env
// ========================================================

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");
const { getCompetitiveProfile } = require("../../modules/global/profiles/profile.service");
const { buildProfileUI } = require("../../modules/global/profiles/profile.presenter");

// ========================================================
// DEBUG anti-spam (Word)
// - Em produção NÃO pode poluir terminal com clique de comando
// - Para ativar logs: DEBUG_COMMANDS=true no .env
// ========================================================
const DEBUG_COMMANDS = String(process.env.DEBUG_COMMANDS || "").toLowerCase() === "true";

// cooldown (memória)
const profileCooldown = new Map();

function formatTimeLeft(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Mostra o perfil competitivo"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const lang = getUserLang(userId);

    // ========================================================
    // DEBUG: log do comando (se ativado)
    // ========================================================
    if (DEBUG_COMMANDS) {
      logger.info(`[CMD] /perfil por ${interaction.user.tag} (${userId})`);
    }

    // ✅ Sempre deferReply para impedir timeout de 3s
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // ========================================================
    // Canal correto (do Word)
    // ========================================================
    const allowedChannelId = azyron.channels.competitiveProfile;
    if (allowedChannelId && interaction.channelId !== allowedChannelId) {
      return interaction.editReply({
        content: t(lang, "PROFILE_WRONG_CHANNEL", { channel: `<#${allowedChannelId}>` }),
      });
    }

    // ========================================================
    // Cooldown
    // ========================================================
    const COOLDOWN_PROFILE = 1000 * 30; // 30s

    const now = Date.now();
    const last = profileCooldown.get(userId);
    if (last) {
      const diff = now - last;
      if (diff < COOLDOWN_PROFILE) {
        const left = COOLDOWN_PROFILE - diff;
        return interaction.editReply({
          content: t(lang, "PROFILE_COOLDOWN", { time: formatTimeLeft(left) }),
        });
      }
    }
    profileCooldown.set(userId, now);

    try {
      // ========================================================
      // DB: carrega (ou cria) perfil competitivo
      // ========================================================
      const profile = getCompetitiveProfile(userId);

      // ========================================================
      // UI centralizada
      // ========================================================
      const { pages, tabsRows, navRow } = buildProfileUI({
        lang,
        mode: "SELF",
        viewerUserId: userId,
        targetUser: interaction.user,
        targetMember: interaction.member,
        profileData: profile,
        guildId: interaction.guild?.id,
      });

      let page = 0;

      const message = await interaction.editReply({
        embeds: [pages[page]],
        components: [...tabsRows, navRow(page)],
      });

      const collector = message.createMessageComponentCollector({ time: 1000 * 60 * 5 });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            flags: MessageFlags.Ephemeral,
            content: t(lang, "COMMON_ONLY_YOU"),
          });
        }

        if (i.customId === "profile_page_player") page = 0;
        if (i.customId === "profile_page_badges") page = 1;
        if (i.customId === "profile_page_matches") page = 2;
        if (i.customId === "profile_page_goals") page = 3;
        if (i.customId === "profile_page_rivalries") page = 4;

        if (i.customId === "profile_back") page = Math.max(0, page - 1);
        if (i.customId === "profile_next") page = Math.min(pages.length - 1, page + 1);

        await i.update({
          embeds: [pages[page]],
          components: [...tabsRows, navRow(page)],
        });
      });

      collector.on("end", async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch {}
      });
    } catch (err) {
      logger.error("Erro no /perfil", err);
      return interaction.editReply({ content: t(lang, "PROFILE_LOAD_ERROR") });
    }
  },
};
