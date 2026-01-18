// src/database/sqlite.js

// ========================================================
// SQLite Manager - Jarvis
//
// ✅ Responsável por:
// - conectar no jarvis.sqlite
// - aplicar schema base
// - aplicar migrações leves (ALTER TABLE add column)
// ========================================================

const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");

const logger = require("../core/logger");

let db;

// ========================================================
// Helpers
// ========================================================

function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function addColumnIfMissing(table, column, sqlTypeAndDefault) {
  if (hasColumn(table, column)) return;

  logger.warn(`Migração: adicionando coluna ${table}.${column}`);
  db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlTypeAndDefault}`).run();
}

function hasTable(table) {
  const found = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name=?
      `
    )
    .get(table);

  return !!found;
}

function ensureCompetitiveProfileColumns() {
  // ========================================================
  // Migração compatibilidade perfil (schema novo)
  // ========================================================

  // Rank system
  addColumnIfMissing("competitive_profile", "xp", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "seasonRank", "TEXT");

  // ✅ Player / Word
  addColumnIfMissing("competitive_profile", "championships", "INTEGER NOT NULL DEFAULT 0");

  // Match stats
  addColumnIfMissing("competitive_profile", "wins", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "losses", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "draws", "INTEGER NOT NULL DEFAULT 0");

  // streaks / goals
  addColumnIfMissing("competitive_profile", "currentStreak", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "bestStreak", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "goalsScored", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "goalsConceded", "INTEGER NOT NULL DEFAULT 0");

  // ✅ record goals (Word)
  addColumnIfMissing("competitive_profile", "bestGoalsScoredInMatch", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "bestGoalsConcededInMatch", "INTEGER NOT NULL DEFAULT 0");

  // STAFF / PRIVADO
  addColumnIfMissing("competitive_profile", "woWins", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "warnings", "INTEGER NOT NULL DEFAULT 0");

  // Badges (novo)
  addColumnIfMissing("competitive_profile", "badgesJson", "TEXT");

  // Rivalries (novo completo)
  addColumnIfMissing("competitive_profile", "nemesisId", "TEXT");
  addColumnIfMissing("competitive_profile", "nemesisLosses", "INTEGER NOT NULL DEFAULT 0");

  addColumnIfMissing("competitive_profile", "favoriteId", "TEXT");
  addColumnIfMissing("competitive_profile", "favoriteWins", "INTEGER NOT NULL DEFAULT 0");

  addColumnIfMissing("competitive_profile", "bestWinOpponentId", "TEXT");
  addColumnIfMissing("competitive_profile", "bestWinGoalsFor", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "bestWinGoalsAgainst", "INTEGER NOT NULL DEFAULT 0");

  // Moderation/system
  addColumnIfMissing("competitive_profile", "punishedUntil", "INTEGER");
  addColumnIfMissing("competitive_profile", "updatedAt", "INTEGER NOT NULL DEFAULT 0");

  // ========================================================
  // Compatibilidade LEGACY (colunas antigas que podem existir)
  // ========================================================
  // ⚠️ Não remove colunas antigas, apenas garante que o código novo funcione.
  addColumnIfMissing("competitive_profile", "badges", "TEXT");
  addColumnIfMissing("competitive_profile", "bestWinText", "TEXT");
}

function postMigrationFixes() {
  // ⚠️ Normalizações para evitar problemas futuros

  try {
    // seasonRank: se existir mas estiver NULL -> preencher unranked
    if (hasColumn("competitive_profile", "seasonRank")) {
      db.prepare(
        `
        UPDATE competitive_profile
        SET seasonRank = 'unranked'
        WHERE seasonRank IS NULL OR TRIM(seasonRank) = ''
        `
      ).run();
    }
  } catch (err) {
    logger.warn("Falha em postMigrationFixes (ignorado).", err);
  }
}

function runMigrations() {
  try {
    if (!hasTable("competitive_profile")) return;

    ensureCompetitiveProfileColumns();
    postMigrationFixes();

    logger.info("Migrações SQLite aplicadas com sucesso.");
  } catch (err) {
    logger.error("Erro ao aplicar migrações SQLite.", err);
    throw err;
  }
}

// ========================================================
// Public API
// ========================================================

function connectDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "jarvis.sqlite");

  logger.info(`Conectando SQLite: ${dbPath}`);
  db = new Database(dbPath);

  // pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}

function getDb() {
  if (!db) connectDb();
  return db;
}

function applySchema() {
  connectDb();

  const schemaPath = path.join(__dirname, "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    throw new Error("schema.sql não encontrado em src/database/schema.sql");
  }

  const schema = fs.readFileSync(schemaPath, "utf8");

  logger.info("Aplicando schema SQLite (schema.sql)...");
  db.exec(schema);
  logger.info("Schema aplicado com sucesso.");

  // ✅ mesmo se schema já existir, migrações garantem compatibilidade
  runMigrations();
}

module.exports = {
  connectDb,
  getDb,
  applySchema,
};
