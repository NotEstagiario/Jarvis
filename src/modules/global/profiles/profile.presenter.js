// src/modules/global/profiles/profile.presenter.js

// ========================================================
// Profile Presenter (GLOBAL)
// v1.4
//
// Objetivo:
// - Centralizar UI de /perfil e /analisarperfil
// - Garantir consistência PT/EN
// - Evitar divergência futura
//
// buildProfileUI({
//   lang,
//   mode: "SELF" | "STAFF",
//   viewerUserId,
//   targetUser,      // discord.js User
//   targetMember,    // discord.js GuildMember (opcional)
//   profileData,     // vindo do getCompetitiveProfile()
// })
//
// Retorna:
// {
//   pages: EmbedBuilder[],
//   tabsRows: ActionRowBuilder[],
//   navRow: (page) => ActionRowBuilder
// }
//
// ========================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { t } = require("../../../i18n");

const EMOJI_COMPETITIVE = "<:bensa_evil:1453193952277827680>";

function unrankedText(lang) {
  return lang === "en-US" ? "Unranked" : "Sem Rank";
}

function naText(lang) {
  return "N/A";
}

function saldoEmoji(saldo) {
  if (saldo > 0) return "🔼";
  if (saldo < 0) return "🔽";
  return "⏺️";
}

function formatPunish(ts, lang) {
  if (!ts) return naText(lang);
  const n = Number(ts);
  if (!n || Number.isNaN(n)) return naText(lang);
  return `<t:${Math.floor(n / 1000)}:R>`;
}

// ========================================================
// STAFF extras (roles)
// ========================================================
function getRolesCount(targetMember) {
  try {
    if (!targetMember?.roles?.cache) return 0;
    // remove @everyone
    return Math.max(0, targetMember.roles.cache.size - 1);
  } catch {
    return 0;
  }
}

function getHighestRoleText(targetMember, guildId, lang) {
  try {
    if (!targetMember?.roles?.highest) return naText(lang);
    const highest = targetMember.roles.highest;

    // se for @everyone, retorna N/A
    if (!highest?.id || highest.id === guildId) return naText(lang);

    return `${highest}`;
  } catch {
    return naText(lang);
  }
}

// ========================================================
// Buttons builders
// ========================================================
function buildTabsRow1(lang) {
  return new ActionRowBuilder().addComponents(
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
}

function buildTabsRow2Staff() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("profile_page_staff")
      .setLabel("Staff")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Danger)
  );
}

function buildNavRow(lang, pagesLength, page) {
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

  if (page < pagesLength - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("profile_next")
        .setLabel(t(lang, "PROFILE_BTN_NEXT"))
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return row;
}

// ========================================================
// buildProfileUI
// ========================================================
function buildProfileUI({
  lang,
  mode,
  viewerUserId,
  targetUser,
  targetMember,
  profileData,
  guildId,
}) {
  const staffMode = mode === "STAFF";

  const pages = [];

  const author = {
    name: targetUser.username,
    iconURL: targetUser.displayAvatarURL(),
  };

  // ========================================================
  // Page 0 - Player
  // ========================================================
  pages.push(
    new EmbedBuilder()
      .setAuthor(author)
      .setColor(0x2b2d31)
      .setDescription(
        `# ${EMOJI_COMPETITIVE} ${t(lang, "PROFILE_TITLE_PLAYER")}: ${targetUser}`
      )
      .addFields(
        {
          name: "",
          inline: true,
          value: `🏅 **${t(lang, "PROFILE_STAT_SEASON_RANK")}**: ${unrankedText(lang)}`,
        },
        {
          name: "",
          inline: true,
          value: `✨ **${t(lang, "PROFILE_STAT_XP")}**: ${Number(profileData.xp ?? 0)}`,
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

  // ========================================================
  // Page 1 - Badges
  // ========================================================
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

  // ========================================================
  // Page 2 - Matches
  // ========================================================
  const wins = Number(profileData.wins ?? 0);
  const losses = Number(profileData.losses ?? 0);
  const draws = Number(profileData.draws ?? 0);
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
            profileData.currentStreak ?? 0
          )}`,
        },
        {
          name: "",
          inline: false,
          value: `🏅 **${t(lang, "PROFILE_STAT_STREAK_BEST")}**: ${Number(
            profileData.bestStreak ?? 0
          )}`,
        }
      )
  );

  // ========================================================
  // Page 3 - Goals
  // ========================================================
  const scored = Number(profileData.goalsScored ?? 0);
  const conceded = Number(profileData.goalsConceded ?? 0);
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

  // ========================================================
  // Page 4 - Rivalries
  // ========================================================
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

  // ========================================================
  // Page 5 - Staff Private
  // ========================================================
  if (staffMode) {
    const rolesCount = getRolesCount(targetMember);
    const highestRoleText = getHighestRoleText(targetMember, guildId, lang);

    pages.push(
      new EmbedBuilder()
        .setAuthor(author)
        .setColor(0xb71c1c)
        .setDescription(
          lang === "en-US" ? `# 🛡️ Staff — Private data` : `# 🛡️ Staff — Dados privados`
        )
        .addFields(
          {
            name: lang === "en-US" ? "👤 UserId" : "👤 UserId",
            value: `\`${targetUser.id}\``,
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
            name: "🟣 WO Wins",
            value: `\`${Number(profileData.woWins ?? 0)}\``,
            inline: true,
          },
          {
            name: lang === "en-US" ? "⚠️ Warnings" : "⚠️ Advertências",
            value: `\`${Number(profileData.warnings ?? 0)}\``,
            inline: true,
          },
          {
            name: lang === "en-US" ? "⛔ Punished until" : "⛔ Punido até",
            value: `${formatPunish(profileData.punishedUntil, lang)}`,
            inline: true,
          }
        )
        .setFooter({
          text: lang === "en-US" ? "Only Staff can see this." : "Apenas Staff pode ver.",
        })
    );
  }

  const tabsRows = [buildTabsRow1(lang)];
  if (staffMode) tabsRows.push(buildTabsRow2Staff(lang));

  return {
    pages,
    tabsRows,
    navRow: (page) => buildNavRow(lang, pages.length, page),
  };
}

module.exports = { buildProfileUI };
