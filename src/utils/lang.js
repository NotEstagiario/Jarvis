// src/utils/lang.js

// ========================================================
// Lang utils
//
// ✅ Fonte real do idioma agora é SQLite (users.language)
// ========================================================

const { getUserLanguage } = require("../modules/global/language/language.service");

function getUserLang(userId) {
  return getUserLanguage(userId);
}

module.exports = { getUserLang };
