// src/modules/global/badges/badges.catalog.js

// ========================================================
// Badges Catalog (GLOBAL)
//
// Objetivo:
// - Centralizar TODAS as insígnias (itens) existentes no servidor
// - O editor staff vai usar isso para montar o seletor
//
// Estrutura esperada:
// {
//   id: "primeiro_diamante",
//   emoji: "💎",
//   name: { "pt-BR": "Meu primeiro Diamante", "en-US": "My first Diamond" },
//   description: { "pt-BR": "...", "en-US": "..." },
// }
//
// OBS: Por enquanto propositalmente vazio.
// ========================================================

const BADGES = [];

// futuro helper
function getBadges() {
  return BADGES;
}

function getBadgeById(id) {
  return BADGES.find((b) => b.id === id) || null;
}

module.exports = {
  BADGES,
  getBadges,
  getBadgeById,
};
