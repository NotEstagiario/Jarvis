// src/database/sqlite.js

// ========================================================
// Conexão SQLite - Jarvis
// Este arquivo controla:
// - conexão do banco
// - aplicação de schema.sql automaticamente
// ========================================================

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");

const DB_FILE = path.join(process.cwd(), "jarvis.sqlite");
const SCHEMA_FILE = path.join(__dirname, "schema.sql");

let db;

function connect() {
  if (db) return db;

  logger.info(`Conectando SQLite: ${DB_FILE}`);
  db = new Database(DB_FILE);
  db.pragma("foreign_keys = ON");

  return db;
}

function applySchema() {
  const database = connect();

  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error(`schema.sql não encontrado em: ${SCHEMA_FILE}`);
  }

  const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
  logger.info("Aplicando schema SQLite (schema.sql)...");
  database.exec(schema);
  logger.info("Schema aplicado com sucesso.");
}

function getDb() {
  return connect();
}

module.exports = {
  connect,
  getDb,
  applySchema,
};
