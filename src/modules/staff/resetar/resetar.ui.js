// src/modules/staff/resetar/resetar.ui.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const { t } = require("../../../i18n");
const { getUserLang } = require("../../../utils/lang");
const { isAdminWord } = require("../../../utils/admin");

const azyron = require("../../../config/azyronIds");
const logger = require("../../../core/logger");

const { resetCompetitiveStaffFull } = require("../../global/profiles/profile.service");

const { BTN, MODAL } = require("./resetar.constants");
const { createRequest, getRequest, updateRequest, deleteRequest, sweepOld } = require("./resetar.state");

const {
  isPresident,
  isResetChannel,
  nowUnix,
  presidentMention,
  checkGlobalPassword,
  sendLogEmbed,
  resetAllCompetitiveProfiles,
  resetAllCompetitiveProfilesAndRemoveRanks,
  removeCompetitiveRankRolesFromUser,
} = require("./resetar.service");

// ========================================================
// ✅ Word — cor padrão da Central de Reset
// ========================================================
const COLOR_RESET = 0xd83c3c;

// ========================================================
// Utils
// ========================================================
function isValidDiscordId(id) {
  return /^\d{6,32}$/.test(String(id || ""));
}

async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
    return interaction.reply(payload);
  } catch {
    // ignore
  }
}

async function safeUpdate(interaction, payload) {
  try {
    return interaction.update(payload);
  } catch {
    try {
      return interaction.editReply(payload);
    } catch {
      // ignore
    }
  }
}

async function safeDM(user, payload) {
  try {
    return await user.send(payload);
  } catch (err) {
    logger.warn("Falha ao enviar DM (resetar).", err);
    return null;
  }
}

// ========================================================
// Embeds (HOME / HUB)
// ========================================================
function buildHomeEmbed(lang) {
  return new EmbedBuilder()
    .setColor(COLOR_RESET)
    .setDescription(
      lang === "en-US"
        ? [
            "# 🧹 Reset Center",
            "",
            "Choose a reset category.",
            "",
            "🧹 Reset Statistics",
            "🏆 Reset Ranks",
            "📅 Reset Season",
            "🌐 Reset Global",
          ].join("\n")
        : [
            "# 🧹 Central de Reset",
            "",
            "Escolha uma categoria de reset.",
            "",
            "🧹 Reset Estatísticas",
            "🏆 Reset Ranks",
            "📅 Reset Season",
            "🌐 Reset Global",
          ].join("\n")
    );
}

function buildHomeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.OPEN_STATS).setEmoji("🧹").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.OPEN_RANKS).setEmoji("🏆").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.OPEN_SEASON).setEmoji("📅").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.GLOBAL_ALL).setEmoji("🌐").setStyle(ButtonStyle.Danger)
  );
}

// ========================================================
// Embeds (STATS MENU)
// OBS: removido "Voltar" do texto (pra não gerar duplicação de wizard)
// O usuário pode fechar pelo Dismiss.
// ========================================================
function buildStatsMenuEmbed(lang) {
  return new EmbedBuilder()
    .setColor(COLOR_RESET)
    .setDescription(
      lang === "en-US"
        ? [
            "# 🧹 Reset — Statistics",
            "",
            "Choose the reset type.",
            "",
            "👤 Reset Individual",
            "🌐 Reset Global",
          ].join("\n")
        : [
            "# 🧹 Reset — Estatísticas",
            "",
            "Escolha o tipo de reset.",
            "",
            "👤 Reset Individual",
            "🌐 Reset Global",
          ].join("\n")
    );
}

function buildStatsMenuRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.STATS_INDIVIDUAL).setEmoji("👤").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.STATS_GLOBAL).setEmoji("🌐").setStyle(ButtonStyle.Danger)
    // ✅ sem botão voltar
  );
}

function buildPlaceholderEmbed(lang, title) {
  return new EmbedBuilder()
    .setColor(COLOR_RESET)
    .setDescription(lang === "en-US" ? `# ${title}\n\n⚠️ Coming soon.` : `# ${title}\n\n⚠️ Em breve.`);
}

// ========================================================
// President request embeds
// ========================================================
function buildRequestEmbed(req) {
  return new EmbedBuilder()
    .setColor(COLOR_RESET)
    .setDescription(
      [
        "# 🌐 Pedido de Reset Global",
        "",
        "⚠️ A Staff está solicitando um reset global.",
        "",
        `**Staff:** <@${req.staffId}>`,
        `**Tipo:** ${req.type === "GLOBAL_ALL" ? "Reset Global (Tudo)" : "Reset Global (Estatísticas)"}`,
        `**Justificativa:** ${req.justification}`,
        "",
        "Presidente, autoriza essa ação?",
      ].join("\n")
    );
}

function buildPresidentRow(reqId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BTN.PRES_CONFIRM}:${reqId}`)
      .setLabel("✅ Eu confirmo")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BTN.PRES_DENY}:${reqId}`)
      .setLabel("❌ Não autorizo")
      .setStyle(ButtonStyle.Danger)
  );
}

function buildDecisionEmbed(ok) {
  return new EmbedBuilder()
    .setColor(ok ? 0x35c46a : COLOR_RESET)
    .setDescription(ok ? "# ✅ Autorizado\n\nReset executado." : "# ❌ Negado\n\nReset cancelado.");
}

function buildDoneEmbed(lang, msg) {
  return new EmbedBuilder().setColor(COLOR_RESET).setDescription(
    lang === "en-US" ? `# ✅ Completed\n\n${msg}` : `# ✅ Concluído\n\n${msg}`
  );
}

function buildStaffDecisionDMEmbed(req, ok) {
  return new EmbedBuilder()
    .setColor(ok ? 0x35c46a : COLOR_RESET)
    .setDescription(
      [
        `# ${ok ? "✅ Reset Global Autorizado" : "❌ Reset Global Negado"}`,
        "",
        `**Tipo:** ${req.type === "GLOBAL_ALL" ? "Reset Global (Tudo)" : "Reset Global (Estatísticas)"}`,
        `**Justificativa:** ${req.justification}`,
        `**Solicitante:** <@${req.staffId}>`,
        "",
        `**Data/Hora:** <t:${nowUnix()}:F>`,
      ].join("\n")
    );
}

// ========================================================
// Buttons Handler (Wizard Router)
// ========================================================
async function handleResetarButton(interaction) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);
  const { customId } = interaction;

  // ✅ só no canal resetar
  if (!isResetChannel(interaction.channelId)) {
    return safeReply(interaction, {
      ephemeral: true,
      content:
        lang === "en-US"
          ? `⚠️ Use this panel only in <#${azyron.channels.resetar}>.`
          : `⚠️ Use este painel somente em <#${azyron.channels.resetar}>.`,
    });
  }

  // ✅ só staff/admin word
  const allowed = isAdminWord(interaction.member, userId);
  if (!allowed) {
    return safeReply(interaction, {
      ephemeral: true,
      content: t(lang, "EDITOR_ONLY_STAFF"),
    });
  }

  // ========================================================
  // HOME (ephemeral wizard start)
  // ========================================================
  if (
    customId === BTN.OPEN_STATS ||
    customId === BTN.OPEN_RANKS ||
    customId === BTN.OPEN_SEASON ||
    customId === BTN.GLOBAL_ALL
  ) {
    // Se clicou no painel fixo: abre wizard HOME
    if (customId === BTN.OPEN_STATS) {
      const payload = { embeds: [buildStatsMenuEmbed(lang)], components: [buildStatsMenuRow()] };

      if (interaction.replied || interaction.deferred) return safeUpdate(interaction, payload);
      return interaction.reply({ ephemeral: true, ...payload });
    }

    if (customId === BTN.OPEN_RANKS) {
      const payload = { embeds: [buildPlaceholderEmbed(lang, "🏆 Reset Ranks")], components: [] };
      if (interaction.replied || interaction.deferred) return safeUpdate(interaction, payload);
      return interaction.reply({ ephemeral: true, ...payload });
    }

    if (customId === BTN.OPEN_SEASON) {
      const payload = { embeds: [buildPlaceholderEmbed(lang, "📅 Reset Season")], components: [] };
      if (interaction.replied || interaction.deferred) return safeUpdate(interaction, payload);
      return interaction.reply({ ephemeral: true, ...payload });
    }

    // ========================================================
    // GLOBAL ALL -> modal (Presidente bypass NÃO passa por modal)
    // ========================================================
    if (customId === BTN.GLOBAL_ALL) {
      // ✅ BYPASS PRESIDENTE (não pede senha, não pede autorização)
      if (isPresident(userId)) {
        await resetAllCompetitiveProfilesAndRemoveRanks(interaction.guild);

        await sendLogEmbed(interaction.guild, {
          ok: true,
          description:
            `# 🌐 Reset Global (Tudo)\n\n` +
            `**Executor:** <@${userId}>\n` +
            `**Tipo:** Reset Global (Tudo)\n` +
            `**Justificativa:** (BYPASS PRESIDENTE)\n` +
            `**Data/Hora:** <t:${nowUnix()}:F>\n\n` +
            `✅ Reset global concluído.`,
        });

        return safeReply(interaction, {
          ephemeral: true,
          embeds: [buildDoneEmbed(lang, lang === "en-US" ? "Global reset executed." : "Reset global executado.")],
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(MODAL.GLOBAL_ALL)
        .setTitle(lang === "en-US" ? "Global Reset (All)" : "Reset Global (Tudo)");

      const inputJustify = new TextInputBuilder()
        .setCustomId("justify")
        .setLabel(lang === "en-US" ? "Justification" : "Justificativa")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(5)
        .setMaxLength(500)
        .setRequired(true);

      const inputPass = new TextInputBuilder()
        .setCustomId("password")
        .setLabel(lang === "en-US" ? "Global password" : "Senha global")
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(128)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(inputJustify),
        new ActionRowBuilder().addComponents(inputPass)
      );

      return interaction.showModal(modal);
    }

    // fallback wizard home
    const replyPayload = {
      ephemeral: true,
      embeds: [buildHomeEmbed(lang)],
      components: [buildHomeRow()],
    };

    return safeReply(interaction, replyPayload);
  }

  // ========================================================
  // BACK HOME (mantido por segurança do sistema antigo)
  // mas não exibimos esse botão mais.
  // ========================================================
  if (customId === BTN.BACK_HOME) {
    return safeUpdate(interaction, {
      embeds: [buildHomeEmbed(lang)],
      components: [buildHomeRow()],
    });
  }

  // ========================================================
  // Stats individual -> modal
  // ========================================================
  if (customId === BTN.STATS_INDIVIDUAL) {
    const modal = new ModalBuilder()
      .setCustomId(MODAL.STATS_INDIVIDUAL)
      .setTitle(lang === "en-US" ? "Reset Stats (Individual)" : "Reset Estatísticas (Individual)");

    const inputId = new TextInputBuilder()
      .setCustomId("targetId")
      .setLabel(lang === "en-US" ? "Target user ID" : "ID do usuário")
      .setStyle(TextInputStyle.Short)
      .setMinLength(6)
      .setMaxLength(32)
      .setRequired(true);

    const inputJustify = new TextInputBuilder()
      .setCustomId("justify")
      .setLabel(lang === "en-US" ? "Justification" : "Justificativa")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(5)
      .setMaxLength(500)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputId),
      new ActionRowBuilder().addComponents(inputJustify)
    );

    return interaction.showModal(modal);
  }

  // ========================================================
  // Stats global -> modal (Presidente bypass NÃO passa por modal)
  // ========================================================
  if (customId === BTN.STATS_GLOBAL) {
    if (isPresident(userId)) {
      await resetAllCompetitiveProfilesAndRemoveRanks(interaction.guild);

      await sendLogEmbed(interaction.guild, {
        ok: true,
        description:
          `# 🌐 Reset Global (Estatísticas)\n\n` +
          `**Executor:** <@${userId}>\n` +
          `**Tipo:** Reset Global (Estatísticas)\n` +
          `**Justificativa:** (BYPASS PRESIDENTE)\n` +
          `**Data/Hora:** <t:${nowUnix()}:F>\n\n` +
          `✅ Reset global concluído.`,
      });

      return safeReply(interaction, {
        ephemeral: true,
        embeds: [buildDoneEmbed(lang, lang === "en-US" ? "Global stats reset executed." : "Reset global executado.")],
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(MODAL.STATS_GLOBAL)
      .setTitle(lang === "en-US" ? "Reset Stats (Global)" : "Reset Estatísticas (Global)");

    const inputJustify = new TextInputBuilder()
      .setCustomId("justify")
      .setLabel(lang === "en-US" ? "Justification" : "Justificativa")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(5)
      .setMaxLength(500)
      .setRequired(true);

    const inputPass = new TextInputBuilder()
      .setCustomId("password")
      .setLabel(lang === "en-US" ? "Global password" : "Senha global")
      .setStyle(TextInputStyle.Short)
      .setMinLength(2)
      .setMaxLength(128)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputJustify),
      new ActionRowBuilder().addComponents(inputPass)
    );

    return interaction.showModal(modal);
  }

  // fallback
  return safeReply(interaction, {
    ephemeral: true,
    content: lang === "en-US" ? "⚠️ Unknown reset action." : "⚠️ Ação desconhecida.",
  });
}

// ========================================================
// Modals Handler
// ========================================================
async function handleResetarModal(interaction) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  if (!isResetChannel(interaction.channelId)) {
    return safeReply(interaction, {
      ephemeral: true,
      content:
        lang === "en-US"
          ? `⚠️ Use this only in <#${azyron.channels.resetar}>.`
          : `⚠️ Use isso apenas em <#${azyron.channels.resetar}>.`,
    });
  }

  const allowed = isAdminWord(interaction.member, userId);
  if (!allowed) {
    return safeReply(interaction, {
      ephemeral: true,
      content: t(lang, "EDITOR_ONLY_STAFF"),
    });
  }

  const { customId } = interaction;

  // ========================================================
  // Individual stats reset
  // ========================================================
  if (customId === MODAL.STATS_INDIVIDUAL) {
    const targetId = String(interaction.fields.getTextInputValue("targetId") || "").trim();
    const justification = String(interaction.fields.getTextInputValue("justify") || "").trim();

    if (!isValidDiscordId(targetId)) {
      return safeReply(interaction, {
        ephemeral: true,
        content: lang === "en-US" ? "❌ Invalid ID." : "❌ ID inválido.",
      });
    }

    resetCompetitiveStaffFull(targetId);

    // ✅ WORD: remover cargo de rank também
    await removeCompetitiveRankRolesFromUser(interaction.guild, targetId).catch(() => {});

    await sendLogEmbed(interaction.guild, {
      ok: true,
      description:
        `# 🧹 Reset Estatísticas (Individual)\n\n` +
        `**Executor:** <@${userId}>\n` +
        `**Alvo:** <@${targetId}> (${targetId})\n` +
        `**Justificativa:** ${justification}\n` +
        `**Data/Hora:** <t:${nowUnix()}:F>\n\n` +
        `✅ Reset individual concluído.`,
    });

    return interaction.reply({
      ephemeral: true,
      embeds: [buildDoneEmbed(lang, `Reset individual efetuado em <@${targetId}>.`)],
    });
  }

  // ========================================================
  // Global stats / global all -> authorization request
  // ========================================================
  if (customId === MODAL.STATS_GLOBAL || customId === MODAL.GLOBAL_ALL) {
    const justification = String(interaction.fields.getTextInputValue("justify") || "").trim();
    const password = String(interaction.fields.getTextInputValue("password") || "").trim();

    // ✅ BYPASS PRESIDENTE (se entrou por modal, ainda assim bypass)
    if (isPresident(userId)) {
      await resetAllCompetitiveProfilesAndRemoveRanks(interaction.guild);

      await sendLogEmbed(interaction.guild, {
        ok: true,
        description:
          `# 🌐 Reset Global (Tudo)\n\n` +
          `**Executor:** <@${userId}>\n` +
          `**Tipo:** Reset Global (Tudo)\n` +
          `**Justificativa:** ${justification || "(BYPASS PRESIDENTE)"}\n` +
          `**Data/Hora:** <t:${nowUnix()}:F>\n\n` +
          `✅ Reset global concluído.`,
      });

      return interaction.reply({
        ephemeral: true,
        embeds: [buildDoneEmbed(lang, lang === "en-US" ? "Global reset executed." : "Reset global executado.")],
      });
    }

    const pass = checkGlobalPassword(password);
    if (!pass.ok) {
      return interaction.reply({
        ephemeral: true,
        content: lang === "en-US" ? "❌ Invalid password." : "❌ Senha inválida.",
      });
    }

    sweepOld();

    const reqType = customId === MODAL.GLOBAL_ALL ? "GLOBAL_ALL" : "STATS_GLOBAL";

    const req = createRequest({
      type: reqType,
      staffId: userId,
      staffLang: lang,
      justification,
      passwordOk: true,
      requestChannelId: interaction.channelId,
    });

    const msg = await interaction.channel.send({
      content: `${presidentMention()}`,
      embeds: [buildRequestEmbed(req)],
      components: [buildPresidentRow(req.id)],
    });

    updateRequest(req.id, { requestMessageId: msg.id });

    // ✅ Ephemeral curto (não fica preso como status final)
    return interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RESET)
          .setDescription(
            lang === "en-US"
              ? "# ⏳ Waiting authorization...\n\nRequest sent to the President.\n\n-# You will receive a private confirmation."
              : "# ⏳ Aguardando autorização...\n\nPedido enviado ao Presidente.\n\n-# Você receberá uma confirmação privada."
          ),
      ],
    });
  }

  return interaction.reply({
    ephemeral: true,
    content: lang === "en-US" ? "⚠️ Unknown modal." : "⚠️ Modal desconhecido.",
  });
}

// ========================================================
// President Decision
// ========================================================
async function handlePresidentDecision(interaction) {
  const presidentId = interaction.user.id;

  if (!isPresident(presidentId)) {
    return safeReply(interaction, {
      ephemeral: true,
      content: "❌ Apenas o Presidente pode usar esses botões.",
    });
  }

  if (!isResetChannel(interaction.channelId)) {
    return safeReply(interaction, {
      ephemeral: true,
      content: `⚠️ Use isto apenas em <#${azyron.channels.resetar}>.`,
    });
  }

  const [base, reqId] = interaction.customId.split(":");
  const req = getRequest(reqId);

  if (!req || req.status !== "pending") {
    return safeReply(interaction, {
      ephemeral: true,
      content: "⚠️ Esse pedido expirou ou já foi finalizado.",
    });
  }

  const ok = base === BTN.PRES_CONFIRM;

  if (ok) {
    // ✅ WORD: reset + remove ranks
    await resetAllCompetitiveProfilesAndRemoveRanks(interaction.guild);
  }

  updateRequest(reqId, {
    status: ok ? "authorized" : "denied",
    decidedAt: Date.now(),
    decidedBy: presidentId,
  });

  await interaction.update({
    embeds: [buildDecisionEmbed(ok)],
    components: [],
  });

  // ✅ Notificação privada pro staff (DM)
  try {
    const staffUser = await interaction.client.users.fetch(req.staffId).catch(() => null);
    if (staffUser) {
      await safeDM(staffUser, { embeds: [buildStaffDecisionDMEmbed(req, ok)] });
    }
  } catch (e) {
    logger.warn("Falha ao notificar staff via DM (resetar).", e);
  }

  await sendLogEmbed(interaction.guild, {
    ok,
    description:
      `# 🌐 Reset Global ${ok ? "AUTORIZADO" : "NEGADO"}\n\n` +
      `**Staff solicitante:** <@${req.staffId}>\n` +
      `**Presidente:** <@${presidentId}>\n` +
      `**Tipo:** ${req.type === "GLOBAL_ALL" ? "Reset Global (Tudo)" : "Reset Global (Estatísticas)"}\n` +
      `**Justificativa:** ${req.justification}\n` +
      `**Data/Hora:** <t:${nowUnix()}:F>\n\n` +
      (ok ? "✅ Reset global concluído." : "❌ Reset global cancelado."),
  });

  deleteRequest(reqId);
}

module.exports = {
  handleResetarButton,
  handleResetarModal,
  handlePresidentDecision,
};
