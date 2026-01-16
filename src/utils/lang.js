// src/utils/lang.js

// ========================================================
// Language utils
// Por enquanto: fallback pt-BR
// No futuro: busca real em SQLite (users.language)
// ========================================================

function getUserLang(/* userId */) {
  return "pt-BR";
}

module.exports = { getUserLang };
