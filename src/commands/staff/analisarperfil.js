// src/commands/staff/analisarperfil.js

// ========================================================
// /analisarperfil (STAFF)
//
// ✅ Regra do Word:
// - /perfil = SEMPRE o próprio perfil
// - /analisarperfil = staff escolhe um usuário e analisa
//
// ✅ Extras STAFF (privados):
// - vitórias via WO
// - advertências
// - punishedUntil (se existir)
// - userId do jogador
//
// ✅ EXTRA (NOVO):
// - maior cargo do jogador no servidor
// - quantidade de cargos no servidor
//
// ⚠️ IMPORTANTE:
// - Discord permite no máximo 5 botões por ActionRow
// - então: tabs divididas em 2 linhas
// ========================================================

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");
const { getCompetitiveProfile } = require("../../modules/global/profiles/profile.service");

// ========================================================
// DEBUG anti-spam (Word)
// - Em produção NÃO pode poluir terminal com comando
// - Para ativar logs: DEBUG_COMMANDS=true no .env
// ========================================================
const DEBUG_COMMANDS = String(process.env.DEBUG_COMMANDS || "").toLowerCase() === "true";

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

function hasStaffRole(member) {
  const staffRoleId = azyron.roles.staff;
  if (!staffRoleId) return false;
  return member?.roles?.cache?.has(staffRoleId);
}

function saldoEmoji(saldo) {
  if (saldo > 0) return "🔼";
  if (saldo < 0) return "🔽";
  return "⏺️";
}

function formatPunish(ts, lang) {
  if (!ts) return lang === "en-US" ? "N/A" : "N/A";
  const n = Number(ts);
  if (!n || Number.isNaN(n)) return lang === "en-US" ? "N/A" : "N/A";
  return `<t:${Math.floor(n / 1000)}:R>`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("analisarperfil")
    .setDescription("Analisa o perfil competitivo de um jogador (Staff)")
    .addUserOption((opt) =>
      opt
        .setName("jogador")
        .setDescription("Selecione o jogador para analisar")
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = getUserLang(interaction.user.id);

    // ✅ Anti-spam terminal: loga só se DEBUG_COMMANDS=true
    if (DEBUG_COMMANDS) {
      logger.info(`[CMD] /analisarperfil por ${interaction.user.tag} (${interaction.user.id})`);
    }

    // ✅ sempre deferReply
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // ========================================================
    // Permissão (Staff ou Presidente)
    // ========================================================
    if (!isPresident(interaction.user.id) && !hasStaffRole(interaction.member)) {
      return interaction.editReply({
        content:
          lang === "en-US"
            ? "⛔ You do not have permission to use this command."
            : "⛔ Você não tem permissão para usar este comando.",
      });
    }

    const target = interaction.options.getUser("jogador");
    const profile = getCompetitiveProfile(target.id);

    // membro do servidor (pra extrair cargos)
    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);

    const author = {
      name: target.username,
      iconURL: target.displayAvatarURL(),
    };

    // ========================================================
    // Roles stats (server)
    // ========================================================
    let rolesCount = 0;
    let highestRoleText = lang === "en-US" ? "N/A" : "N/A";

    if (targetMember) {
      // remove @everyone
      rolesCount = Math.max(0, targetMember.roles.cache.size - 1);

      const highestRole = targetMember.roles.highest;
      if (highestRole?.id && highestRole.id !== interaction.guild.id) {
        highestRoleText = `${highestRole}`;
      }
    }

    // ========================================================
    // Pages (mesmo estilo do /perfil)
    // ========================================================
    const pages = [];

    // 0: Jogador
    pages.push(
      new EmbedBuilder()
        .setAuthor(author)
        .setColor(0x2b2d31)
        .setDescription(
          `# <:bensa_evil:1453193952277827680> ${t(lang, "PROFILE_TITLE_PLAYER")}: ${target}`
        )
        .addFields(
          {
            name: "",
            inline: true,
            value: `🏅 **${t(lang, "PROFILE_STAT_SEASON_RANK")}**: ${
              lang === "en-US" ? "Unranked" : "Sem Rank"
            }`,
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

    // 1: Insígnias
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

    // 2: Partidas
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

    // 3: Gols
    const scored = Number(profile.goalsScored ?? 0);
    const conceded = Number(profile.goalsConceded ?? 0);
    const saldo = scored - conceded;

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
            value: `${saldoEmoji(saldo)} **${t(lang, "PROFILE_STAT_GOALS_BALANCE")}**: ${saldo}`,
          }
        )
    );

    // 4: Rivalidades
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

    // 5: STAFF PRIVATE
    pages.push(
      new EmbedBuilder()
        .setAuthor(author)
        .setColor(0xb71c1c)
        .setDescription(
          lang === "en-US"
            ? `# 🛡️ Staff — Private data`
            : `# 🛡️ Staff — Dados privados`
        )
        .addFields(
          {
            name: lang === "en-US" ? "👤 UserId" : "👤 UserId",
            value: `\`${target.id}\``,
            inline: false,
          },
          {
            name: lang === "en-US" ? "🏷️ Highest role" : "🏷️ Maior cargo",
            value: `${highestRoleText}`,
            inline: true,
          },
          {
            name: lang === "en-US" ? "📌 Roles count" : "📌 Quantidade de cargos",
            value: `\`${rolesCount}\``,
            inline: true,
          },
          {
            name: lang === "en-US" ? "🟣 WO Wins" : "🟣 WO Wins",
            value: `\`${Number(profile.woWins ?? 0)}\``,
            inline: true,
          },
          {
            name: lang === "en-US" ? "⚠️ Warnings" : "⚠️ Advertências",
            value: `\`${Number(profile.warnings ?? 0)}\``,
            inline: true,
          },
          {
            name: lang === "en-US" ? "⛔ Punished until" : "⛔ Punido até",
            value: `${formatPunish(profile.punishedUntil, lang)}`,
            inline: true,
          }
        )
        .setFooter({
          text: lang === "en-US" ? "Only Staff can see this." : "Apenas Staff pode ver.",
        })
    );

    // ========================================================
    // Botões (2 rows para não ultrapassar limite de 5)
    // ========================================================
    const tabsRow1 = new ActionRowBuilder().addComponents(
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

    const tabsRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("profile_page_staff")
        .setLabel("Staff")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Danger)
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
      components: [tabsRow1, tabsRow2, navRow(page)],
    });

    const collector = message.createMessageComponentCollector({
      time: 1000 * 60 * 5,
    });

    collector.on("collect", async (i) => {
      // só quem executou o comando
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: t(lang, "COMMON_ONLY_YOU"),
          flags: MessageFlags.Ephemeral,
        });
      }

      // tabs
      if (i.customId === "profile_page_player") page = 0;
      if (i.customId === "profile_page_badges") page = 1;
      if (i.customId === "profile_page_matches") page = 2;
      if (i.customId === "profile_page_goals") page = 3;
      if (i.customId === "profile_page_rivalries") page = 4;
      if (i.customId === "profile_page_staff") page = 5;

      // nav
      if (i.customId === "profile_back") page = Math.max(0, page - 1);
      if (i.customId === "profile_next") page = Math.min(pages.length - 1, page + 1);

      await i.update({
        embeds: [pages[page]],
        components: [tabsRow1, tabsRow2, navRow(page)],
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};
