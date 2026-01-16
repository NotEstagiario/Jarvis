// src/i18n/index.js

// ========================================================
// i18n core (Jarvis)
// - pt-BR / en-US
// - sem libs externas por enquanto (simples e sólido)
// ========================================================

const ptBR = require("./pt-BR.json");
const enUS = require("./en-US.json");

const dictionaries = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

function t(lang, key, vars = {}) {
  const dict = dictionaries[lang] || dictionaries["pt-BR"];
  let text = dict[key] || dictionaries["pt-BR"][key] || key;

  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }

  return text;
}

module.exports = { t };
