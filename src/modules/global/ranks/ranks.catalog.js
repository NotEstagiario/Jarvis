// src/modules/global/ranks/ranks.catalog.js

// ========================================================
// Ranks Catalog (GLOBAL)
//
// ✅ Fonte de verdade para:
// - thresholds de XP
// - labels PT/EN
// - emoji e roleId do Azyron
// - embed color por rank
//
// Regras Word:
// Sem Rank → Cobre → Ferro → Bronze → Prata → Ouro → Diamante
//
// Extra:
// MVP (role estética)
// ========================================================

const azyron = require("../../../config/azyronIds");

const RANKS = [
  {
    id: "unranked",
    label: { "pt-BR": "Sem Rank", "en-US": "Unranked" },
    minXp: 0,
    emoji: "🏳️",
    roleId: null,
    rgb: 0x2b2d31,
    buff: { mult: 1.0, bonus: 0 },
  },

  {
    id: "cobre",
    label: { "pt-BR": "Cobre", "en-US": "Copper" },
    minXp: 20,
    emoji: azyron?.ranks?.cobre?.emoji || "<:comp_cobre:1458792661975564472>",
    roleId: azyron?.ranks?.cobre?.roleId || "1458787560863174729",
    rgb: parseInt("992f19", 16),
    buff: { mult: 1.4, bonus: 2 },
  },

  {
    id: "ferro",
    label: { "pt-BR": "Ferro", "en-US": "Iron" },
    minXp: 150,
    emoji: azyron?.ranks?.ferro?.emoji || "<:comp_ferro:1458792728295903233>",
    roleId: azyron?.ranks?.ferro?.roleId || "1457349081943773296",
    rgb: parseInt("5f4f6a", 16),
    buff: { mult: 1.8, bonus: 4 },
  },

  {
    id: "bronze",
    label: { "pt-BR": "Bronze", "en-US": "Bronze" },
    minXp: 300,
    emoji: azyron?.ranks?.bronze?.emoji || "<:comp_bronze:1458792843861688502>",
    roleId: azyron?.ranks?.bronze?.roleId || "1457353820332888108",
    rgb: parseInt("ee6038", 16),
    buff: { mult: 2.2, bonus: 6 },
  },

  {
    id: "prata",
    label: { "pt-BR": "Prata", "en-US": "Silver" },
    minXp: 600,
    emoji: azyron?.ranks?.prata?.emoji || "<:comp_prata:1458792923402469447>",
    roleId: azyron?.ranks?.prata?.roleId || "1457349239360196854",
    rgb: parseInt("959ec7", 16),
    buff: { mult: 2.7, bonus: 8 },
  },

  {
    id: "ouro",
    label: { "pt-BR": "Ouro", "en-US": "Gold" },
    minXp: 1500,
    emoji: azyron?.ranks?.ouro?.emoji || "<:comp_ouro:1458793814381691024>",
    roleId: azyron?.ranks?.ouro?.roleId || "1453328539901497395",
    rgb: parseInt("ffe1b4", 16),
    buff: { mult: 3.2, bonus: 10 },
  },

  {
    id: "diamante",
    label: { "pt-BR": "Diamante", "en-US": "Diamond" },
    minXp: 3500,
    emoji: azyron?.ranks?.diamante?.emoji || "<:comp_diamante:1458794140308476031>",
    roleId: azyron?.ranks?.diamante?.roleId || "1457349311732912189",
    rgb: parseInt("9e6bff", 16),
    buff: { mult: 3.6, bonus: 12 },
  },
];

const MVP = {
  id: "mvp",
  label: { "pt-BR": "MVP", "en-US": "MVP" },
  roleId: azyron?.ranks?.mvp?.roleId || "1453144649324691497",
  rgb: parseInt("d4843d", 16),
};

function getRanks() {
  return [...RANKS];
}

function getRankById(rankId) {
  const id = String(rankId || "").toLowerCase();
  return RANKS.find((r) => r.id === id) || RANKS[0];
}

function getRankIndex(rankId) {
  const id = String(rankId || "").toLowerCase();
  const idx = RANKS.findIndex((r) => r.id === id);
  return idx < 0 ? 0 : idx;
}

function getRankByXp(xp) {
  const x = Number(xp || 0);
  if (!Number.isFinite(x) || x <= 0) return RANKS[0];

  // maior threshold <= xp
  let chosen = RANKS[0];
  for (const r of RANKS) {
    if (x >= r.minXp) chosen = r;
  }
  return chosen;
}

function getRankLabel(lang, rankId) {
  const r = getRankById(rankId);
  return r?.label?.[lang] || r?.label?.["pt-BR"] || r.id;
}

function getRankEmoji(rankId) {
  return getRankById(rankId)?.emoji || "🏳️";
}

function getRankColor(rankId) {
  return getRankById(rankId)?.rgb || 0x2b2d31;
}

module.exports = {
  getRanks,
  getRankById,
  getRankIndex,
  getRankByXp,
  getRankLabel,
  getRankEmoji,
  getRankColor,
  MVP,
};
