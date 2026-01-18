// src/modules/staff/profileEditor/profileEditor.ui.helpers.js

const { t } = require("../../../i18n");

// Emojis padrão do /perfil (Word)
const EMOJI_TAB_PLAYER = "<:bensa_evil:1453193952277827680>";
const EMOJI_TAB_BADGES = "💎";
const EMOJI_TAB_MATCHES = "⚔️";
const EMOJI_TAB_GOALS = "⚽";
const EMOJI_TAB_RIVALRIES = "👥";

// ✅ emojis seguros (evitar invalid emoji)
// OBS: o “⚽️” com variation selector dá treta às vezes.
// vamos usar "⚽" simples
const SAFE_SOCCER = "⚽";

function formatEditorValue(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "`0`";
  return `\`${num}\``;
}

function sectionTitle(lang, section) {
  if (section === "PLAYER") return t(lang, "EDITOR_SECTION_PLAYER");
  if (section === "BADGES") return t(lang, "EDITOR_SECTION_BADGES");
  if (section === "MATCHES") return t(lang, "EDITOR_SECTION_MATCHES");
  if (section === "GOALS") return t(lang, "EDITOR_SECTION_GOALS");
  if (section === "RIVALRIES") return t(lang, "EDITOR_SECTION_RIVALRIES");
  return section;
}

function sectionEmoji(section) {
  if (section === "PLAYER") return EMOJI_TAB_PLAYER;
  if (section === "BADGES") return EMOJI_TAB_BADGES;
  if (section === "MATCHES") return EMOJI_TAB_MATCHES;
  if (section === "GOALS") return EMOJI_TAB_GOALS;
  if (section === "RIVALRIES") return EMOJI_TAB_RIVALRIES;
  return "📌";
}

// ========================================================
// getSectionStats
//
// ⚠️ IMPORTANTÍSSIMO:
// - seasonRank NÃO entra aqui
// - rank é wizard selector (profileEditor.rank.js)
// ========================================================
function getSectionStats(section) {
  if (section === "PLAYER") {
    return [
      // ✅ rank selector (flow)
      { key: "seasonRank_selector", labelKey: "PROFILE_STAT_SEASON_RANK", emoji: "🏅", isFlow: true },

      { key: "xp", labelKey: "PROFILE_STAT_XP", emoji: "✨" },
      { key: "championships", labelKey: "PROFILE_STAT_CHAMPIONSHIPS", emoji: "🏆" },
    ];
  }

  if (section === "MATCHES") {
    return [
      { key: "wins", labelKey: "EDITOR_STAT_WINS", emoji: "✅" },
      { key: "losses", labelKey: "EDITOR_STAT_LOSSES", emoji: "❌" },
      { key: "draws", labelKey: "EDITOR_STAT_DRAWS", emoji: "➖" },

      { key: "currentStreak", labelKey: "PROFILE_STAT_STREAK_CURRENT", emoji: "🔥" },
      { key: "bestStreak", labelKey: "PROFILE_STAT_STREAK_BEST", emoji: "🏅" },

      { key: "woWins", labelKey: "EDITOR_STAT_WO_WINS", emoji: "🟣" },
      { key: "warnings", labelKey: "EDITOR_STAT_WARNINGS", emoji: "⚠️" },

      // ❌ removido: punishedUntil
      // { key: "punishedUntil", labelKey: "EDITOR_STAT_PUNISHED_UNTIL", emoji: "⛔" },
    ];
  }

  if (section === "GOALS") {
    return [
      { key: "goalsScored", labelKey: "PROFILE_STAT_GOALS_SCORED", emoji: SAFE_SOCCER },
      { key: "goalsConceded", labelKey: "PROFILE_STAT_GOALS_CONCEDED", emoji: "🥅" },
      { key: "goalsBalance", labelKey: "PROFILE_STAT_GOALS_BALANCE", emoji: "📊" },

      // ❌ removidos:
      // { key: "bestGoalsScoredInMatch", labelKey: "EDITOR_GOALS_BEST_SCORED", emoji: "🔥" },
      // { key: "bestGoalsConcededInMatch", labelKey: "EDITOR_GOALS_BEST_CONCEDED", emoji: "💀" },
    ];
  }

  if (section === "BADGES") {
    return [
      { key: "badgeFirstDiamond", labelKey: "EDITOR_BADGE_FIRST_DIAMOND", emoji: "💎" },
      { key: "badgeFirstChampion", labelKey: "EDITOR_BADGE_FIRST_CHAMPION", emoji: "🏆" },
      { key: "badgeLegend", labelKey: "EDITOR_BADGE_LEGEND", emoji: "👑" },
      { key: "badgesTotal", labelKey: "EDITOR_BADGE_TOTAL", emoji: "📦" },

      // ✅ seletor real
      { key: "badgesJson", labelKey: "PROFILE_BTN_BADGES", emoji: "💎", isFlow: true },
    ];
  }

  if (section === "RIVALRIES") {
    return [
      // rivalries é flow (wizard)
      { key: "rivalries_flow", labelKey: "PROFILE_BTN_RIVALRIES", emoji: "👥", isFlow: true },
    ];
  }

  return [];
}

function buildStatButtonLabel(lang, stat) {
  const translated = t(lang, stat.labelKey);
  if (translated && typeof translated === "string" && translated !== stat.labelKey) return translated;
  if (stat.fallbackLabel) return stat.fallbackLabel;
  return stat.key;
}

function getAllowedKeys() {
  // ✅ só campos reais editáveis numericamente
  return [
    // player numeric
    "xp",
    "championships",

    // matches
    "wins",
    "losses",
    "draws",
    "currentStreak",
    "bestStreak",
    "woWins",
    "warnings",

    // ❌ removido: punishedUntil
    // "punishedUntil",

    // goals
    "goalsScored",
    "goalsConceded",
    "goalsBalance",

    // ❌ removidos: bestGoalsScoredInMatch / bestGoalsConcededInMatch
    // "bestGoalsScoredInMatch",
    // "bestGoalsConcededInMatch",

    // badges json real
    "badgesJson",

    // rivalries stats editados via wizard
    "nemesisId",
    "nemesisLosses",
    "favoriteId",
    "favoriteWins",
    "bestWinOpponentId",
    "bestWinGoalsFor",
    "bestWinGoalsAgainst",
  ];
}

module.exports = {
  formatEditorValue,
  getSectionStats,
  buildStatButtonLabel,
  getAllowedKeys,

  sectionTitle,
  sectionEmoji,

  EMOJI_TAB_PLAYER,
  EMOJI_TAB_BADGES,
  EMOJI_TAB_MATCHES,
  EMOJI_TAB_GOALS,
  EMOJI_TAB_RIVALRIES,
};
