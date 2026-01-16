// src/utils/lang.js

// ========================================================
// Utils — Idioma do usuário
//
// Regras do Word:
// - Bot tem 2 idiomas (pt-BR / en-US)
// - Idioma é salvo no perfil do usuário (SQLite)
// - Mudança possui cooldown de 24h
// - President (King N) tem bypass total
// ========================================================

const sqlite = require("../database/sqlite");
const logger = require("../core/logger");

const DEFAULT_LANG = "pt-BR";

function resolveDb() {
  if (sqlite && sqlite.db && typeof sqlite.db.prepare === "function") return sqlite.db;
  if (sqlite && typeof sqlite.getDb === "function") return sqlite.getDb();
  if (sqlite && typeof sqlite.prepare === "function") return sqlite;
  return null;
}

const db = resolveDb();

function ensureLanguageColumns() {
  try {
    if (!db) return;

    const cols = db
      .prepare(`PRAGMA table_info(users)`)
      .all()
      .map((c) => c.name);

    if (!cols.includes("language")) {
      logger.warn("Migração: adicionando coluna users.language");
      db.prepare(`ALTER TABLE users ADD COLUMN language TEXT`).run();
    }

    if (!cols.includes("languageUpdatedAt")) {
      logger.warn("Migração: adicionando coluna users.languageUpdatedAt");
      db.prepare(`ALTER TABLE users ADD COLUMN languageUpdatedAt INTEGER`).run();
    }
  } catch (err) {
    logger.error("Erro garantindo colunas language no SQLite.", err);
  }
}

ensureLanguageColumns();

// ========================================================
// Getter
// ========================================================
function getUserLang(userId) {
  try {
    if (!db) return DEFAULT_LANG;

    const row = db.prepare(`SELECT language FROM users WHERE userId = ?`).get(userId);

    const lang = row?.language;
    if (lang === "pt-BR" || lang === "en-US") return lang;

    return DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// ========================================================
// Setter (apenas salva)
// cooldown é aplicado no language.service.js (module)
// ========================================================
function setUserLang(userId, lang) {
  if (!db) return false;
  if (lang !== "pt-BR" && lang !== "en-US") return false;

  db.prepare(`INSERT OR IGNORE INTO users (userId) VALUES (?)`).run(userId);

  db.prepare(
    `UPDATE users SET language = ?, languageUpdatedAt = ? WHERE userId = ?`
  ).run(lang, Date.now(), userId);

  return true;
}

module.exports = {
  DEFAULT_LANG,
  getUserLang,
  setUserLang,
};
