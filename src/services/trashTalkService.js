/**
 * src/services/trashTalkService.js
 *
 * [UX]
 * Rotating/randomized trash talk messages.
 */

const { t } = require("../i18n");

const lastUsed = new Map(); // userId -> index

function pickIndex(max, avoid) {
  if (max <= 1) return 0;
  let idx = Math.floor(Math.random() * max);
  if (idx === avoid) idx = (idx + 1) % max;
  return idx;
}

function getCompetitiveDeniedMessage(lang, userId) {
  const pack = t(lang, "competitive.deniedPack");
  if (!Array.isArray(pack) || pack.length === 0) return "❌";
  const avoid = lastUsed.get(userId);
  const idx = pickIndex(pack.length, avoid);
  lastUsed.set(userId, idx);
  return pack[idx];
}

module.exports = { getCompetitiveDeniedMessage };
