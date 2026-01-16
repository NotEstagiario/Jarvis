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

function ensureCompetitiveProfileColumns() {
  // ========================================================
  // Migração v1.0/v1.1: compatibilidade perfil
  // ========================================================

  addColumnIfMissing("competitive_profile", "currentStreak", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "bestStreak", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "goalsScored", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "goalsConceded", "INTEGER NOT NULL DEFAULT 0");

  // STAFF / PRIVADO
  addColumnIfMissing("competitive_profile", "woWins", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("competitive_profile", "warnings", "INTEGER NOT NULL DEFAULT 0");

  // extras
  addColumnIfMissing("competitive_profile", "badges", "TEXT");
  addColumnIfMissing("competitive_profile", "nemesisId", "TEXT");
  addColumnIfMissing("competitive_profile", "favoriteId", "TEXT");
  addColumnIfMissing("competitive_profile", "bestWinText", "TEXT");

  addColumnIfMissing("competitive_profile", "punishedUntil", "INTEGER");
  addColumnIfMissing("competitive_profile", "updatedAt", "INTEGER NOT NULL DEFAULT 0");
}

function runMigrations() {
  try {
    // Só roda se a tabela existir
    const exists = db
      .prepare(
        `
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name='competitive_profile'
        `
      )
      .get();

    if (!exists) return;

    ensureCompetitiveProfileColumns();
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

  // ✅ após schema, roda migrações leves
  runMigrations();
}

module.exports = {
  connectDb,
  getDb,
  applySchema,
};
