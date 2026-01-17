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
  lockType TEXT NOT NULL,         -- active | searching | pending_result | pending_review
  token TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- ========================================================
-- Competitive Matches (v2.0)
--
-- status:
-- - active (em vigor)
-- - cancelled
-- - finished_ok
-- - finished_void
-- - pending_result (aguardando confirmação adversário)
-- - pending_review (staff review)
-- ========================================================
CREATE TABLE IF NOT EXISTS competitive_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,

  challengerId TEXT NOT NULL,
  opponentId TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'active',

  createdAt INTEGER NOT NULL,
  startedAt INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,

  pausedAt INTEGER,
  pausedReason TEXT,

  cancelledById TEXT,
  cancelledReason TEXT,

  updatedAt INTEGER NOT NULL
);

-- ========================================================
-- Match Events (log interno para auditoria)
-- ========================================================
CREATE TABLE IF NOT EXISTS competitive_match_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  createdAt INTEGER NOT NULL
);

-- ========================================================
-- Match Invites (v2.0 handshake)
-- status:
-- - pending
-- - accepted
-- - declined
-- - expired
-- ========================================================
CREATE TABLE IF NOT EXISTS competitive_match_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  challengerId TEXT NOT NULL,
  opponentId TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',

  channelId TEXT NOT NULL,

  createdAt INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- ========================================================
-- Premium Reset Cooldown (v2.1)
-- 1 reset por usuário a cada 31 dias
-- ========================================================
CREATE TABLE IF NOT EXISTS premium_profile_resets (
  userId TEXT PRIMARY KEY,
  lastResetAt INTEGER NOT NULL
);
