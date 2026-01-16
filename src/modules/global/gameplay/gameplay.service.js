// src/modules/global/gameplay/gameplay.service.js

// ========================================================
// Gameplay Style Service (GLOBAL)
//
// Regras do Word:
// - Sem cooldown
// - Escolha única (não pode alterar depois)
// - Persistir escolha no SQLite
// - NÃO depender do competitive_profile
//
// Extras v1.3 fix:
// - clearGameplayStyle(): libera escolher de novo (quando cargo removido)
// - setGameplayStyleForce(): bypass do presidente para trocar style
// ========================================================

const logger = require("../../../core/logger");
const { getDb } = require("../../../database/sqlite");

// ========================================================
// Constantes / Enums
// ========================================================
const STYLES = {
  CASUAL: "CASUAL",
  COMPETITIVE: "COMPETITIVE",
};

// ========================================================
// Migrations — tabela própria (segura)
// ========================================================
function ensureGameplayTable() {
  const db = getDb();

  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_gameplay (
        userId TEXT PRIMARY KEY,
        style TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `).run();
  } catch (err) {
    logger.error("Erro garantindo tabela user_gameplay no SQLite.", err);
  }
}

// roda migration assim que carregar o módulo
ensureGameplayTable();

// ========================================================
// API
// ========================================================
function getGameplayStyle(userId) {
  const db = getDb();
  const row = db.prepare(`SELECT style FROM user_gameplay WHERE userId = ?`).get(userId);
  return row?.style || null;
}

function clearGameplayStyle(userId) {
  const db = getDb();
  try {
    db.prepare(`DELETE FROM user_gameplay WHERE userId = ?`).run(userId);
    return { ok: true };
  } catch (err) {
    logger.error("Erro limpando gameplay style no SQLite.", err);
    return { ok: false };
  }
}

// normal (regra Word: escolher UMA vez)
function setGameplayStyleOnce(userId, style) {
  const db = getDb();

  if (!userId) return { ok: false, reason: "INVALID_USER" };
  if (![STYLES.CASUAL, STYLES.COMPETITIVE].includes(style)) {
    return { ok: false, reason: "INVALID_STYLE" };
  }

  const current = getGameplayStyle(userId);
  if (current) {
    return { ok: false, reason: "ALREADY_SET", style: current };
  }

  try {
    db.prepare(`
      INSERT INTO user_gameplay (userId, style, createdAt)
      VALUES (?, ?, ?)
    `).run(userId, style, Date.now());

    return { ok: true, style };
  } catch (err) {
    logger.error("Erro salvando gameplay style no SQLite.", err);
    return { ok: false, reason: "DB_ERROR" };
  }
}

// bypass (presidente): força trocar
function setGameplayStyleForce(userId, style) {
  const db = getDb();

  if (!userId) return { ok: false, reason: "INVALID_USER" };
  if (![STYLES.CASUAL, STYLES.COMPETITIVE].includes(style)) {
    return { ok: false, reason: "INVALID_STYLE" };
  }

  try {
    db.prepare(`
      INSERT INTO user_gameplay (userId, style, createdAt)
      VALUES (?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        style = excluded.style
    `).run(userId, style, Date.now());

    return { ok: true, style };
  } catch (err) {
    logger.error("Erro forçando gameplay style no SQLite.", err);
    return { ok: false, reason: "DB_ERROR" };
  }
}

module.exports = {
  STYLES,
  getGameplayStyle,
  clearGameplayStyle,
  setGameplayStyleOnce,
  setGameplayStyleForce,
};
