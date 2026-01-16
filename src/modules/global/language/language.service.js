// src/modules/global/language/language.service.js

// ========================================================
// Language Service (GLOBAL)
// - Cooldown 24h por usuário
// - Persistente em SQLite
//
// ⚠️ REGRA IMPORTANTE:
// NUNCA executar SQL no topo do arquivo (no require),
// porque o deploy-commands carrega arquivos SEM inicializar DB.
// ========================================================

const logger = require("../../../core/logger");
const { getDb } = require("../../../database/sqlite");

const COOLDOWN_MS = 1000 * 60 * 60 * 24; // 24h

function ensureLanguageCooldownTable() {
  const db = getDb();

  // cria tabela se não existir
  db.prepare(`
    CREATE TABLE IF NOT EXISTS language_cooldowns (
      userId TEXT PRIMARY KEY,
      lastChangeAt INTEGER NOT NULL
    )
  `).run();
}

function ensurePanelsTable() {
  const db = getDb();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS fixed_panels (
      key TEXT PRIMARY KEY,
      channelId TEXT NOT NULL,
      messageId TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `).run();
}

// ========================================================
// Cooldown
// ========================================================
function canChangeLanguage(userId) {
  const db = getDb();
  ensureLanguageCooldownTable();

  const row = db
    .prepare(`SELECT lastChangeAt FROM language_cooldowns WHERE userId = ?`)
    .get(userId);

  if (!row) return true;

  const diff = Date.now() - Number(row.lastChangeAt);
  return diff >= COOLDOWN_MS;
}

function getTimeLeftToChangeLanguage(userId) {
  const db = getDb();
  ensureLanguageCooldownTable();

  const row = db
    .prepare(`SELECT lastChangeAt FROM language_cooldowns WHERE userId = ?`)
    .get(userId);

  if (!row) return "0s";

  const diff = Date.now() - Number(row.lastChangeAt);
  const left = Math.max(0, COOLDOWN_MS - diff);

  const totalSeconds = Math.ceil(left / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function markLanguageChange(userId) {
  const db = getDb();
  ensureLanguageCooldownTable();

  db.prepare(`
    INSERT INTO language_cooldowns (userId, lastChangeAt)
    VALUES (?, ?)
    ON CONFLICT(userId) DO UPDATE SET lastChangeAt = excluded.lastChangeAt
  `).run(userId, Date.now());
}

// ========================================================
// Painel fixo (armazenar messageId / channelId)
// ========================================================
function savePanelMessage(panelKey, channelId, messageId) {
  const db = getDb();
  ensurePanelsTable();

  db.prepare(`
    INSERT INTO fixed_panels (key, channelId, messageId, updatedAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      channelId = excluded.channelId,
      messageId = excluded.messageId,
      updatedAt = excluded.updatedAt
  `).run(panelKey, channelId, messageId, Date.now());
}

function getPanelMessage(panelKey) {
  const db = getDb();
  ensurePanelsTable();

  return db
    .prepare(`SELECT key, channelId, messageId FROM fixed_panels WHERE key = ?`)
    .get(panelKey);
}

module.exports = {
  COOLDOWN_MS,
  canChangeLanguage,
  getTimeLeftToChangeLanguage,
  markLanguageChange,

  savePanelMessage,
  getPanelMessage,
};
