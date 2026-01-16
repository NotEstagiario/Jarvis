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

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");
const { getCompetitiveProfile } = require("../../modules/global/profiles/profile.service");

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
    await interaction.deferReply({ ephemeral: true });

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
      // Páginas / UI (mantendo o estilo do antigo)
      // ========================================================
      const pages = [];

      const author = {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      };

      // ========================================================
      // Helper: texto de rank default
      // ========================================================
      const seasonRankText = lang === "en-US" ? "Unranked" : "Sem Rank";

      // página 1 - jogador
      pages.push(
        new EmbedBuilder()
          .setAuthor(author)
          .setColor(0x2b2d31)
          .setDescription(
            `# <:bensa_evil:1453193952277827680> ${t(lang, "PROFILE_TITLE_PLAYER")}: ${interaction.user}`
          )
          .addFields(
            {
              name: "",
              inline: true,
              value: `🏅 **${t(lang, "PROFILE_STAT_SEASON_RANK")}**: ${seasonRankText}`,
            },
            {
              name: "",
              inline: true,
              value: `✨ **${t(lang, "PROFILE_STAT_XP")}**: ${Number(profile.xp ?? 0)}`,
            },
            {
              name: "",
              inline: true,
              value: `🏆 **${t(lang, "PROFILE_STAT_CHAMPIONSHIPS")}**: ${t(
                lang,
                "PROFILE_VALUE_NONE_MASC"
              )}`,
            }
          )
      );

      // página 2 - insignias
      pages.push(
        new EmbedBuilder()
          .setAuthor(author)
          .setColor(0x2b2d31)
          .setDescription(`# 💎 ${t(lang, "PROFILE_TITLE_BADGES")}`)
          .addFields({
            name: "",
            inline: false,
            value: `${t(lang, "PROFILE_VALUE_NONE_FEM")}.`,
          })
      );

      // página 3 - partidas
      const wins = Number(profile.wins ?? 0);
      const losses = Number(profile.losses ?? 0);
      const draws = Number(profile.draws ?? 0);
      const total = wins + losses + draws;
      const winRate = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : "N/A";

      pages.push(
        new EmbedBuilder()
          .setAuthor(author)
          .setColor(0x2b2d31)
          .setDescription(`# ⚔️ ${t(lang, "PROFILE_TITLE_MATCHES")}`)
          .addFields(
            {
              name: "",
              inline: true,
              value: `🥇 **${t(lang, "PROFILE_STAT_WLD")}**: ${wins} / ${losses} / ${draws}`,
            },
            {
              name: "",
              inline: true,
              value: `📊 **${t(lang, "PROFILE_STAT_WINRATE")}**: ${winRate}`,
            },
            {
              name: "",
              inline: false,
              value: `🔥 **${t(lang, "PROFILE_STAT_STREAK_CURRENT")}**: ${Number(
                profile.currentStreak ?? 0
              )}`,
            },
            {
              name: "",
              inline: false,
              value: `🏅 **${t(lang, "PROFILE_STAT_STREAK_BEST")}**: ${Number(
                profile.bestStreak ?? 0
              )}`,
            }
          )
      );

      // página 4 - gols
      const scored = Number(profile.goalsScored ?? 0);
      const conceded = Number(profile.goalsConceded ?? 0);
      const saldo = scored - conceded;
      const saldoEmoji = saldo > 0 ? "🔼" : saldo < 0 ? "🔽" : "⏺️";

      pages.push(
        new EmbedBuilder()
          .setAuthor(author)
          .setColor(0x2b2d31)
          .setDescription(`# ⚽ ${t(lang, "PROFILE_TITLE_GOALS")}`)
          .addFields(
            {
              name: "",
              inline: true,
              value: `⚽️ **${t(lang, "PROFILE_STAT_GOALS_SCORED")}**: ${scored}`,
            },
            {
              name: "",
              inline: true,
              value: `🥅 **${t(lang, "PROFILE_STAT_GOALS_CONCEDED")}**: ${conceded}`,
            },
            {
              name: "",
              inline: true,
              value: `${saldoEmoji} **${t(lang, "PROFILE_STAT_GOALS_BALANCE")}**: ${saldo}`,
            }
          )
      );

      // página 5 - rivalidades
      pages.push(
        new EmbedBuilder()
          .setAuthor(author)
          .setColor(0x2b2d31)
          .setDescription(`# 👫 ${t(lang, "PROFILE_TITLE_RIVALRIES")}`)
          .addFields(
            {
              name: "",
              inline: true,
              value: `💀 **${t(lang, "PROFILE_STAT_NEMESIS")}**: N/A`,
            },
            {
              name: "",
              inline: true,
              value: `☠️ **${t(lang, "PROFILE_STAT_FAVORITE")}**: N/A`,
            },
            {
              name: "",
              inline: true,
              value: `⚽️ **${t(lang, "PROFILE_STAT_BESTWIN")}**: N/A`,
            }
          )
      );

      const rowPages = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("profile_page_player")
          .setLabel(t(lang, "PROFILE_BTN_PLAYER"))
          .setEmoji("<:bensa_evil:1453193952277827680>")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("profile_page_badges")
          .setLabel(t(lang, "PROFILE_BTN_BADGES"))
          .setEmoji("💎")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("profile_page_matches")
          .setLabel(t(lang, "PROFILE_BTN_MATCHES"))
          .setEmoji("⚔️")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("profile_page_goals")
          .setLabel(t(lang, "PROFILE_BTN_GOALS"))
          .setEmoji("⚽")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("profile_page_rivalries")
          .setLabel(t(lang, "PROFILE_BTN_RIVALRIES"))
          .setEmoji("👥")
          .setStyle(ButtonStyle.Secondary)
      );

      const navRow = (page) => {
        const row = new ActionRowBuilder();

        if (page > 0) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("profile_back")
              .setLabel(t(lang, "PROFILE_BTN_BACK"))
              .setEmoji("⬅️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        if (page < pages.length - 1) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("profile_next")
              .setLabel(t(lang, "PROFILE_BTN_NEXT"))
              .setEmoji("➡️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        return row;
      };

      let page = 0;

      const message = await interaction.editReply({
        embeds: [pages[page]],
        components: [rowPages, navRow(page)],
      });

      const collector = message.createMessageComponentCollector({ time: 1000 * 60 * 5 });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
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
          components: [rowPages, navRow(page)],
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
