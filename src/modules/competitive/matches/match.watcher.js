// src/modules/competitive/matches/match.watcher.js

const logger = require("../../../core/logger");
const azyron = require("../../../config/azyronIds");

const { getDb } = require("../../../database/sqlite");
const { getUserLang } = require("../../../utils/lang");

const {
  buildMatchExpiredPublicEmbed,
  buildMatchExpiredLogEmbed,
} = require("./match.presenter");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchExpiredMatches() {
  const db = getDb();

  // ⚠️ ajuste para sua tabela real:
  // Assumindo tabela: competitive_matches com status + expiresAt
  return db
    .prepare(
      `
      SELECT *
      FROM competitive_matches
      WHERE status = 'active'
        AND expiresAt IS NOT NULL
        AND expiresAt <= ?
      LIMIT 10
    `
    )
    .all(Date.now());
}

function markMatchExpired(token) {
  const db = getDb();
  db.prepare(
    `
    UPDATE competitive_matches
    SET status = 'expired',
        updatedAt = ?
    WHERE token = ?
  `
  ).run(Date.now(), token);
}

/**
 * Advertência mínima:
 * incrementa warnings na tabela competitive_profile
 * (Se você tem outro sistema de warnings/penalties, me avisa e eu conecto nele.)
 */
function warnUser(userId) {
  const db = getDb();

  // ⚠️ ajuste para sua tabela real (pelo que você já usa: competitive_profile existe)
  db.prepare(
    `
    UPDATE competitive_profile
    SET warnings = COALESCE(warnings, 0) + 1,
        updatedAt = ?
    WHERE userId = ?
  `
  ).run(Date.now(), userId);
}

async function tryEditPublicMessage(client, match) {
  try {
    const guild = await client.guilds.fetch(match.guildId);
    const channel = await guild.channels.fetch(match.channelId);
    const msg = await channel.messages.fetch(match.messageId);

    const publicLang = getUserLang(match.challengerId);

    await msg.edit({
      embeds: [
        buildMatchExpiredPublicEmbed(
          match.challengerId,
          match.opponentId,
          match.token,
          publicLang
        ),
      ],
    });

    return msg.url;
  } catch (e) {
    logger.warn("Watcher: falha editando msg pública (talvez deletada).", e);
    return match.messageUrl || null;
  }
}

async function sendStaffLog(client, match, messageUrl) {
  try {
    const guild = await client.guilds.fetch(match.guildId);
    const staffChannel = await guild.channels.fetch(azyron.channels.logs).catch(() => null);
    if (!staffChannel) return;

    await staffChannel.send({
      embeds: [
        buildMatchExpiredLogEmbed({
          token: match.token,
          challengerId: match.challengerId,
          opponentId: match.opponentId,
          channelId: match.channelId,
          messageUrl: messageUrl || match.messageUrl,
        }),
      ],
    });
  } catch (e) {
    logger.error("Watcher: falha ao enviar log staff match expirado", e);
  }
}

async function processMatch(client, match) {
  try {
    // 1) marca expirado
    markMatchExpired(match.token);

    // 2) editar embed pública
    const url = await tryEditPublicMessage(client, match);

    // 3) aplicar advertência (Word)
    warnUser(match.challengerId);
    warnUser(match.opponentId);

    // 4) log staff
    await sendStaffLog(client, match, url);
  } catch (e) {
    logger.error("Watcher: erro processando match expirado", e);
  }
}

async function startMatchWatcher(client, { intervalMs = 20_000 } = {}) {
  logger.info(`[MATCH WATCHER] iniciado (${intervalMs}ms)`);

  while (true) {
    try {
      const expired = fetchExpiredMatches();

      for (const match of expired) {
        await processMatch(client, match);
        await sleep(150); // anti-ratelimit
      }
    } catch (e) {
      logger.error("Watcher loop error", e);
    }

    await sleep(intervalMs);
  }
}

module.exports = {
  startMatchWatcher,
};
