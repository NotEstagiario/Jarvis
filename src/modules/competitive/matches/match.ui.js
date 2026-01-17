// src/modules/competitive/matches/match.ui.js

const logger = require("../../../core/logger");
const azyron = require("../../../config/azyronIds");

const { t } = require("../../../i18n");
const { getUserLang } = require("../../../utils/lang");

const { getDb } = require("../../../database/sqlite");

const {
  buildAskOpponentEmbed,
  buildConfirmEmbed,
  buildConfirmButtons,
  buildInviteEmbed,
  buildInviteButtons,
  buildMatchPublicEmbed,
  buildMatchLogEmbed,
  buildExpiredEmbed,
  buildCancelledEmbed,

  // ✅ NEW
  buildInviteSentEmbed,
  buildInviteDeclinedEmbed,
} = require("./match.presenter");

const { createMatchActive, clearLock, setLock, userHasAnyLock } = require("./match.service");
const { LOCK_TYPES } = require("./match.constants");

const { createInvite, getInvite, setInviteStatus, isInviteExpired } = require("./match.invites");

// challenger -> opponent
const pendingOpponent = new Map();

// ========================================================
// Wizard state (pra cancelar timers anteriores)
// userId -> { step, timerId }
// ========================================================
const wizardState = new Map();

function now() {
  return Date.now();
}

// ========================================================
// ✅ resposta correta de wizard
// - botões SEMPRE update
// ========================================================
async function safeUpdate(interaction, payload) {
  try {
    return await interaction.update(payload);
  } catch (e) {
    try {
      if (interaction.message?.edit) return await interaction.message.edit(payload);
    } catch {}
    logger.warn("Falha safeUpdate (ignorado).");
  }
}

async function safeReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return interaction.followUp(payload);
    return interaction.reply(payload);
  } catch {}
}

function getUserLangDb(userId) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT language FROM users WHERE userId = ?").get(userId);
    return row?.language || "pt-BR";
  } catch {
    return "pt-BR";
  }
}

async function getMemberColor(interaction, userId) {
  try {
    const member = await interaction.guild.members.fetch(userId);
    return member?.displayColor || 0x2b2d31;
  } catch {
    return 0x2b2d31;
  }
}

// ========================================================
// helper: troca lock (blindado)
// ========================================================
function forceSetLock(userId, type, token = null) {
  try {
    setLock(userId, type, token);
  } catch (e) {
    logger.error("Falha ao setar lock (/desafiar)", e);
  }
}

// ========================================================
// ✅ NEW: encerra timer anterior da etapa
// ========================================================
function clearWizardTimer(userId) {
  try {
    const st = wizardState.get(userId);
    if (st?.timerId) clearTimeout(st.timerId);
  } catch {}
}

// ========================================================
// ✅ NEW: arma timeout REAL por etapa
// - Cancela wizard UI (edit embed atual)
// - Remove botões
// - Clear lock
// ========================================================
function armWizardTimeout({ userId, lockType, interactionRef, color, ms = 60_000 }) {
  clearWizardTimer(userId);

  const timerId = setTimeout(async () => {
    try {
      const lock = userHasAnyLock(userId);
      const currentType = String(lock?.lockType || "").toLowerCase();

      // só encerra se ainda estiver no passo esperado
      if (!lock) return;
      if (currentType !== String(lockType || "").toLowerCase()) return;

      clearLock(userId);
      pendingOpponent.delete(userId);

      // fecha o wizard atual
      try {
        await interactionRef.editReply({
          embeds: [buildExpiredEmbed(userId, color)],
          components: [],
        });
      } catch {}
    } catch (e) {
      logger.error("Falha timeout wizard (/desafiar)", e);
    }
  }, ms);

  wizardState.set(userId, { step: lockType, timerId });
}

// ========================================================
// ========================================================
// WIZARD FLOW
// ========================================================
// ========================================================

async function handleChallengeHaveOpponent(interaction) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);
  const color = await getMemberColor(interaction, userId);

  // etapa SETUP
  forceSetLock(userId, LOCK_TYPES.PENDING_SETUP, null);

  // ✅ cancela timer anterior e inicia novo
  armWizardTimeout({
    userId,
    lockType: LOCK_TYPES.PENDING_SETUP,
    interactionRef: interaction,
    color,
    ms: 60_000,
  });

  const expiresAt = now() + 60_000;

  // ✅ wizard: atualiza a mesma mensagem
  await safeUpdate(interaction, {
    embeds: [buildAskOpponentEmbed(userId, color, expiresAt)],
    components: [],
  });

  // agora aguarda o @ (mensagem do user no chat)
  try {
    const channel = interaction.channel;

    const collected = await channel.awaitMessages({
      filter: (m) => m.author.id === userId,
      max: 1,
      time: 60_000,
      errors: ["time"],
    });

    const msg = collected.first();
    if (!msg) {
      clearLock(userId);
      pendingOpponent.delete(userId);

      try {
        await interaction.editReply({ components: [] });
      } catch {}

      return safeReply(interaction, {
        ephemeral: true,
        content: lang === "en-US" ? "⏳ Time expired. Use /desafiar again." : "⏳ Tempo esgotado. Use /desafiar novamente.",
      });
    }

    const opponentUser = msg.mentions.users.first();
    await msg.delete().catch(() => {});

    if (!opponentUser) {
      clearLock(userId);
      pendingOpponent.delete(userId);

      try {
        await interaction.editReply({ components: [] });
      } catch {}

      return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_MODAL_INVALID") });
    }

    const opponentId = opponentUser.id;

    if (opponentId === userId) {
      clearLock(userId);
      pendingOpponent.delete(userId);

      try {
        await interaction.editReply({ components: [] });
      } catch {}

      return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_SELF") });
    }

    try {
      await interaction.guild.members.fetch(opponentId);
    } catch {
      clearLock(userId);
      pendingOpponent.delete(userId);

      try {
        await interaction.editReply({ components: [] });
      } catch {}

      return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_OPP_NOT_FOUND") });
    }

    pendingOpponent.set(userId, opponentId);

    // etapa CONFIRM
    forceSetLock(userId, LOCK_TYPES.PENDING_CONFIRM, null);

    armWizardTimeout({
      userId,
      lockType: LOCK_TYPES.PENDING_CONFIRM,
      interactionRef: interaction,
      color,
      ms: 60_000,
    });

    const expiresAtConfirm = now() + 60_000;

    // ✅ wizard: atualiza a mesma mensagem, agora com botões
    return interaction.editReply({
      embeds: [buildConfirmEmbed(userId, opponentId, color, expiresAtConfirm)],
      components: buildConfirmButtons(userId),
    });
  } catch (err) {
    clearLock(userId);
    pendingOpponent.delete(userId);

    logger.warn("Collector /desafiar falhou ou expirou.", err);

    try {
      await interaction.editReply({ components: [] });
    } catch {}

    return safeReply(interaction, {
      ephemeral: true,
      content: lang === "en-US" ? "⏳ Time expired. Use /desafiar again." : "⏳ Tempo esgotado. Use /desafiar novamente.",
    });
  }
}

async function handleChallengeSearchOpponent(interaction) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);
  const color = await getMemberColor(interaction, userId);

  // trava durante essa etapa (coming soon)
  forceSetLock(userId, LOCK_TYPES.SEARCHING, null);

  armWizardTimeout({
    userId,
    lockType: LOCK_TYPES.SEARCHING,
    interactionRef: interaction,
    color,
    ms: 60_000,
  });

  // v2.0.1 depois
  clearLock(userId);

  return safeUpdate(interaction, {
    embeds: [],
    components: [],
    content: lang === "en-US" ? "🚧 Coming soon (v2.0.1)." : "🚧 Em breve (v2.0.1).",
  });
}

// ========================================================
// Challenger confirma -> cria INVITE (não ACTIVE)
// ========================================================
async function handleChallengeConfirm(interaction) {
  const challengerId = interaction.user.id;
  const lang = getUserLang(challengerId);
  const opponentId = pendingOpponent.get(challengerId);

  const color = await getMemberColor(interaction, challengerId);

  if (!opponentId) {
    clearLock(challengerId);
    pendingOpponent.delete(challengerId);

    try {
      await safeUpdate(interaction, { components: [] });
    } catch {}

    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_EXPIRED") });
  }

  // etapa INVITE
  forceSetLock(challengerId, LOCK_TYPES.PENDING_INVITE, null);

  armWizardTimeout({
    userId: challengerId,
    lockType: LOCK_TYPES.PENDING_INVITE,
    interactionRef: interaction,
    color,
    ms: 60_000,
  });

  // cria convite 5 min
  const expiresAt = now() + 5 * 60 * 1000;

  const inviteRes = createInvite({
    challengerId,
    opponentId,
    channelId: interaction.channelId,
    expiresAt,
  });

  pendingOpponent.delete(challengerId);

  // ✅ wizard: fecha botões dessa etapa
  await safeUpdate(interaction, {
    components: [],
  });

  // ========================================================
  // ✅ AQUI: some com o texto feio e manda EMBED BONITA
  // ========================================================
  await safeReply(interaction, {
    ephemeral: true,
    embeds: [
      buildInviteSentEmbed({
        challengerId,
        opponentId,
        lang,
        color,
        expiresAt,
      }),
    ],
  });

  // invite público no idioma REAL do adversário (SQLite)
  const oppLang = getUserLangDb(opponentId);

  const msg = await interaction.channel.send({
    content: `<@${opponentId}>`,
    embeds: [
      buildInviteEmbed({
        challengerId,
        opponentId,
        lang: oppLang,
        color,
        expiresAt,
      }),
    ],
    components: buildInviteButtons(inviteRes.inviteId, oppLang),
  });

  // auto-expira invite
  setTimeout(async () => {
    try {
      const invite = getInvite(inviteRes.inviteId);
      if (!invite) return;
      if (invite.status !== "pending") return;

      if (isInviteExpired(invite)) {
        setInviteStatus(inviteRes.inviteId, "expired");
        await msg.delete().catch(() => {});
        clearLock(challengerId);
      }
    } catch (e) {
      logger.error("Falha expirando invite (/desafiar)", e);
    }
  }, 5 * 60 * 1000);
}

// ========================================================
// Opponent aceita
// ========================================================
async function handleChallengeAccept(interaction, inviteId) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  const invite = getInvite(inviteId);
  if (!invite) {
    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_INVITE_INVALID") });
  }

  // segurança: só opponent
  if (invite.opponentId !== userId) {
    return safeReply(interaction, { ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
  }

  if (invite.status !== "pending") {
    await interaction.message.delete().catch(() => {});
    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_INVITE_ALREADY_HANDLED") });
  }

  if (isInviteExpired(invite)) {
    setInviteStatus(inviteId, "expired");
    await interaction.message.delete().catch(() => {});
    clearLock(invite.challengerId);
    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_INVITE_TOO_LATE") });
  }

  setInviteStatus(inviteId, "accepted");

  const challengerId = invite.challengerId;
  const opponentId = invite.opponentId;

  const color = await getMemberColor(interaction, challengerId);

  // BUGFIX: remove locks antes de virar ACTIVE
  clearLock(challengerId);
  clearLock(opponentId);

  const res = createMatchActive({ challengerId, opponentId });

  if (!res.ok) {
    if (res.reason === "LOCKED") {
      return safeReply(interaction, {
        ephemeral: true,
        content: t(lang, "COMP_LOCKED", { type: res.lock.lockType, token: res.lock.token || "-" }),
      });
    }

    if (res.reason === "OPPONENT_LOCKED") {
      return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_OPP_LOCKED") });
    }

    logger.error("Falha createMatchActive", res);
    return safeReply(interaction, { ephemeral: true, content: t(lang, "COMMON_ERROR_GENERIC") });
  }

  await interaction.message.delete().catch(() => {});

  await safeReply(interaction, {
    ephemeral: true,
    content: t(lang, "CHALLENGE_CREATED", { token: res.match.token }),
  });

  const publicLang = getUserLang(challengerId);

  const publicMsg = await interaction.channel.send({
    embeds: [
      buildMatchPublicEmbed(challengerId, opponentId, res.match.token, color, publicLang, res.match.expiresAt),
    ],
  });

  try {
    const logChannelId = azyron.channels.logs;
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);

    if (logChannel) {
      await logChannel.send({
        embeds: [
          buildMatchLogEmbed({
            token: res.match.token,
            challengerId,
            opponentId,
            expiresAt: res.match.expiresAt,
            channelId: interaction.channelId,
            messageUrl: publicMsg?.url,
            color: 0x2ecc71,
          }),
        ],
      });
    }
  } catch (e) {
    logger.error("Falha log staff match", e);
  }
}

// ========================================================
// Opponent recusa
// ========================================================
async function handleChallengeDecline(interaction, inviteId) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  const invite = getInvite(inviteId);
  if (!invite) {
    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_INVITE_INVALID") });
  }

  if (invite.opponentId !== userId) {
    return safeReply(interaction, { ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
  }

  if (invite.status !== "pending") {
    await interaction.message.delete().catch(() => {});
    return safeReply(interaction, { ephemeral: true, content: t(lang, "CHALLENGE_INVITE_ALREADY_HANDLED") });
  }

  setInviteStatus(inviteId, "declined");
  await interaction.message.delete().catch(() => {});

  clearLock(invite.challengerId);

  // ========================================================
  // ✅ NEW: avisa challenger com embed bonita
  // ========================================================
  try {
    const challengerId = invite.challengerId;
    const opponentId = invite.opponentId;

    const chLang = getUserLangDb(challengerId);

    await interaction.channel.send({
      content: `<@${challengerId}>`,
      embeds: [
        buildInviteDeclinedEmbed({
          challengerId,
          opponentId,
          lang: chLang,
          color: 0xe74c3c,
        }),
      ],
    });
  } catch (e) {
    logger.error("Falha ao avisar challenger sobre recusa do convite", e);
  }

  return safeReply(interaction, {
    ephemeral: true,
    content: t(lang, "CHALLENGE_INVITE_DECLINED_OK"),
  });
}

// ========================================================
// Cancelar wizard
// ========================================================
async function handleChallengeAbort(interaction) {
  const userId = interaction.user.id;
  const color = await getMemberColor(interaction, userId);

  pendingOpponent.delete(userId);
  clearLock(userId);

  // ✅ cancela timers dessa pessoa
  clearWizardTimer(userId);
  wizardState.delete(userId);

  // ✅ wizard: muda o embed e fecha botões
  await safeUpdate(interaction, {
    embeds: [buildCancelledEmbed(userId, color)],
    components: [],
  });

  // ✅ mensagem final (uma vez)
  const lang = getUserLang(userId);
  return safeReply(interaction, {
    ephemeral: true,
    content: lang === "en-US" ? "✅ Search was cancelled." : "✅ A procura foi cancelada.",
  });
}

module.exports = {
  handleChallengeHaveOpponent,
  handleChallengeSearchOpponent,
  handleChallengeConfirm,
  handleChallengeAccept,
  handleChallengeDecline,
  handleChallengeAbort,
};
