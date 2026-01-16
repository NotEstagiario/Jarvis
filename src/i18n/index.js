// src/i18n/index.js

// ========================================================
// i18n core (Jarvis)
//
// ✅ Regras do projeto:
// - pt-BR / en-US desde o início
// - fallback automático para pt-BR
// - sem libs externas por enquanto (simples e sólido)
// - placeholders com {variavel}
//
// ⚠️ CUIDADO:
// - Não remova o fallback do pt-BR
// - Evitar strings hardcoded fora do i18n
// ========================================================

const ptBR = require("./pt-BR.json");
const enUS = require("./en-US.json");

// ========================================================
// Dicionários disponíveis
// ========================================================
const dictionaries = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

// ========================================================
// t(lang, key, vars)
//
// lang: "pt-BR" | "en-US"
// key: chave do JSON
// vars: { nome: "x" } -> substitui {nome}
// ========================================================
function t(lang, key, vars = {}) {
  const dict = dictionaries[lang] || dictionaries["pt-BR"];

  // fallback:
  // 1) dict do idioma
  // 2) dict pt-BR
  // 3) mostra a própria key
  let text = dict?.[key] || dictionaries["pt-BR"]?.[key] || key;

  // replace de variáveis
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }

  return text;
}

module.exports = { t };
