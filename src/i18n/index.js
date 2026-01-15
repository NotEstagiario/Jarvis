/**
 * src/i18n/index.js
 *
 * [CRITICAL][UX]
 * All player-facing text must pass through i18n so the bot remains bilingual.
 */

const ptBR = require("./pt-BR.json");
const en = require("./en.json");

const DICTS = {
  "PT_BR": ptBR,
  "EN": en,
};

function deepGet(obj, path) {
  return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function formatVars(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));
}

function t(lang, key, vars) {
  const dict = DICTS[lang] || DICTS.PT_BR;
  const raw = deepGet(dict, key);
  if (raw === undefined) return key;
  return formatVars(raw, vars);
}

module.exports = { t };
