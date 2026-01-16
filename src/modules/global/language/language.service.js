// src/modules/global/language/language.service.js

// ========================================================
// Language Service (Global)
//
// ✅ Regras (Word):
// - bot tem 2 idiomas: pt-BR e en-US
// - cooldown 24h pra trocar de idioma
// - presidente tem bypass total
// ========================================================

const { getDb } = require("../../../database/sqlite");
const azyron = require("../../../config/azyronIds");

const COOLDOWN_MS = 1000 * 60 * 60 * 24; // 24h
const DEFAULT_LANG = "pt-BR";
const SUPPORTED = new Set(["pt-BR", "en-US"]);

function now() {
  return Date.now();
}

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

function ensureUserRow(userId) {
  const db = getDb();

  const row = db.prepare(`SELECT userId, language, languageUpdatedAt FROM users WHERE userId = ?`).get(userId);

  if (row) return row;

  const ts = now();
  db.prepare(
    `INSERT INTO users (userId, language, languageUpdatedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, DEFAULT_LANG, 0, ts, ts);

  return db.prepare(`SELECT userId, language, languageUpdatedAt FROM users WHERE userId = ?`).get(userId);
}

function getUserLanguage(userId) {
  const row = ensureUserRow(userId);
  const lang = row?.language || DEFAULT_LANG;
  if (!SUPPORTED.has(lang)) return DEFAULT_LANG;
  return lang;
}

function canChangeLanguage(userId) {
  if (isPresident(userId)) return { ok: true, leftMs: 0 };

  const row = ensureUserRow(userId);
  const last = Number(row.languageUpdatedAt || 0);

  const diff = now() - last;
  if (diff >= COOLDOWN_MS) return { ok: true, leftMs: 0 };

  return { ok: false, leftMs: COOLDOWN_MS - diff };
}

function setUserLanguage(userId, newLang) {
  if (!SUPPORTED.has(newLang)) {
    throw new Error(`Idioma inválido: ${newLang}`);
  }

  const db = getDb();
  ensureUserRow(userId);

  const allowed = canChangeLanguage(userId);
  if (!allowed.ok) return { ok: false, leftMs: allowed.leftMs, lang: getUserLanguage(userId) };

  const ts = now();
  db.prepare(
    `UPDATE users
     SET language = ?, languageUpdatedAt = ?, updatedAt = ?
     WHERE userId = ?`
  ).run(newLang, ts, ts, userId);

  return { ok: true, leftMs: 0, lang: newLang };
}

module.exports = {
  DEFAULT_LANG,
  SUPPORTED,
  COOLDOWN_MS,
  getUserLanguage,
  canChangeLanguage,
  setUserLanguage,
};
