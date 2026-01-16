-- src/database/schema.sql

-- ========================================================
-- Schema SQLite - Jarvis
-- ATENÇÃO: alterar tabelas em produção requer migração.
-- ========================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  languageUpdatedAt INTEGER,
  style TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- ========================================================
-- Perfil competitivo (compatível com o /profile antigo + stats staff)
-- ========================================================
CREATE TABLE IF NOT EXISTS competitive_profile (
  userId TEXT PRIMARY KEY,

  -- rank system
  xp INTEGER NOT NULL DEFAULT 0,

  -- match stats
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,

  -- streaks
  currentStreak INTEGER NOT NULL DEFAULT 0,
  bestStreak INTEGER NOT NULL DEFAULT 0,

  -- goals
  goalsScored INTEGER NOT NULL DEFAULT 0,
  goalsConceded INTEGER NOT NULL DEFAULT 0,

  -- STAFF / PRIVADO
  woWins INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,

  -- badges/insignias (texto simples como no antigo)
  badges TEXT,

  -- rivalries
  nemesisId TEXT,
  favoriteId TEXT,
  bestWinText TEXT,

  -- moderation/system
  punishedUntil INTEGER,
  updatedAt INTEGER NOT NULL
);

-- ========================================================
-- Locks (1 confronto por jogador - base do /desafiar)
-- ========================================================
CREATE TABLE IF NOT EXISTS competitive_locks (
  userId TEXT PRIMARY KEY,
  lockType TEXT NOT NULL,         -- active | pending | searching
  token TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
