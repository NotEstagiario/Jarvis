-- src/database/schema.sql

-- ========================================================
-- Schema SQLite - Jarvis
-- ATENÇÃO: alterar tabelas em produção requer migração.
-- ========================================================

PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  languageUpdatedAt INTEGER,
  style TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS competitive_profile (
  userId TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'unranked',
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goalsFor INTEGER NOT NULL DEFAULT 0,
  goalsAgainst INTEGER NOT NULL DEFAULT 0,
  winStreakCurrent INTEGER NOT NULL DEFAULT 0,
  winStreakBest INTEGER NOT NULL DEFAULT 0,
  woWins INTEGER NOT NULL DEFAULT 0,
  alerts INTEGER NOT NULL DEFAULT 0,
  championships INTEGER NOT NULL DEFAULT 0,
  mvpCount INTEGER NOT NULL DEFAULT 0,
  punishedUntil INTEGER,
  updatedAt INTEGER NOT NULL
);
