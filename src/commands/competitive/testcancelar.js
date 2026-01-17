// src/commands/competitive/testcancelar.js

// ========================================================
// /testcancelar (TEMPORÁRIO - v2.0)
//
// ⚠️ ESTE COMANDO VAI SER REMOVIDO QUANDO /cancelar OFICIAL ENTRAR.
//
// Objetivo:
// - liberar lock de confronto para continuar testes
// - cancelar por token / usuário
// ========================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { getDb } = require("../../database/sqlite");

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

function hasAdminPerm(interaction) {
  // administrador ou presidente
  if (isPresident(interaction.user.id)) return true;

  // admin permission
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;
}

// remove lock por userId
function clearLock(userId) {
  const db = getDb();
  const row = db.prepare("SELECT token FROM competitive_locks WHERE userId = ?").get(userId);

  db.prepare("DELETE FROM competitive_locks WHERE userId = ?").run(userId);

  return row?.token || null;
}

// remove locks por token
function clearLocksByToken(token) {
  const db = getDb();

  const rows = db.prepare("SELECT userId FROM competitive_locks WHERE token = ?").all(token);
  db.prepare("DELETE FROM competitive_locks WHERE token = ?").run(token);

  return rows.map((r) => r.userId);
}

function tableExists(name) {
  const db = getDb();
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return !!row;
}

// se existir tabela matches, tenta cancelar pelo token
function deleteMatchByTokenIfExists(token) {
  const db = getDb();
  if (!tableExists("competitive_matches")) return false;

  db.prepare("DELETE FROM competitive_matches WHERE token = ?").run(token);
  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testcancelar")
    .setDescription("🧪 (TEMP) Cancela/libera confronto para testes (staff only)")
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Usuário para liberar lock")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("token")
        .setDescription("Token AZ-XXXXXXXXXX para cancelar o confronto")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({ ephemeral: true, content: "⚠️ Use no servidor." });
      }

      if (!hasAdminPerm(interaction)) {
        return interaction.reply({
          ephemeral: true,
          content: "❌ Apenas administradores podem usar este comando.",
        });
      }

      const db = getDb();

      const targetUser = interaction.options.getUser("usuario");
      const tokenRaw = interaction.options.getString("token");

      // normaliza token se vier completo
      let token = tokenRaw ? String(tokenRaw).trim().toUpperCase() : null;
      if (token && !token.startsWith("AZ-")) token = `AZ-${token}`;

      const cleared = {
        byToken: false,
        token: null,
        users: [],
      };

      // ========================================================
      // 1) se token veio: cancela por token
      // ========================================================
      if (token) {
        const ids = clearLocksByToken(token);
        cleared.users.push(...ids);
        cleared.byToken = true;
        cleared.token = token;

        // tenta limpar match se existir tabela
        deleteMatchByTokenIfExists(token);

        logger.warn(`[TEST] /testcancelar por token ${token} | users=${ids.join(",") || "-"}`);

        return interaction.reply({
          ephemeral: true,
          content: `✅ Confronto liberado por token **${token}**.\nUsuários: ${ids.length ? ids.map((id) => `<@${id}>`).join(", ") : "nenhum"}`,
        });
      }

      // ========================================================
      // 2) se veio usuario: libera lock dele
      // ========================================================
      if (targetUser) {
        const tok = clearLock(targetUser.id);
        cleared.users.push(targetUser.id);
        cleared.token = tok;

        // se tiver token, remove locks do outro lado também
        if (tok) {
          const otherIds = clearLocksByToken(tok);
          otherIds.forEach((id) => {
            if (!cleared.users.includes(id)) cleared.users.push(id);
          });

          deleteMatchByTokenIfExists(tok);
        }

        logger.warn(`[TEST] /testcancelar user=${targetUser.id} token=${tok || "-"}`);

        return interaction.reply({
          ephemeral: true,
          content: `✅ Locks liberados.\nUsuários: ${cleared.users.map((id) => `<@${id}>`).join(", ")}\nToken: ${cleared.token ? `\`${cleared.token}\`` : "nenhum"}`,
        });
      }

      // ========================================================
      // 3) default: libera lock do autor
      // ========================================================
      const tok = clearLock(interaction.user.id);
      cleared.users.push(interaction.user.id);
      cleared.token = tok;

      if (tok) {
        const otherIds = clearLocksByToken(tok);
        otherIds.forEach((id) => {
          if (!cleared.users.includes(id)) cleared.users.push(id);
        });

        deleteMatchByTokenIfExists(tok);
      }

      logger.warn(`[TEST] /testcancelar self=${interaction.user.id} token=${tok || "-"}`);

      return interaction.reply({
        ephemeral: true,
        content: `✅ Lock liberado.\nUsuários: ${cleared.users.map((id) => `<@${id}>`).join(", ")}\nToken: ${cleared.token ? `\`${cleared.token}\`` : "nenhum"}`,
      });
    } catch (err) {
      logger.error("Erro no /testcancelar", err);
      return interaction.reply({
        ephemeral: true,
        content: "❌ Erro ao liberar o confronto de teste.",
      });
    }
  },
};
