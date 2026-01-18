// src/modules/staff/profileEditor/profileEditor.rivalries.js

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

const { getState, setState } = require("./profileEditor.state");
const { BTN, MODAL, MENU } = require("./profileEditor.constants");

const { updateStat } = require("./profileEditor.service");
const { logStaffProfileEdit } = require("./profileEditor.logger");

const COLOR = 0xe2b719;

const FLOW = {
  NONE: "NONE",
  NEMESIS: "NEMESIS",
  FAVORITE: "FAVORITE",
  BESTWIN: "BESTWIN",
};

// ========================================================
// Helpers ACK-safe
// ========================================================
async function safeEditReply(interaction, payload) {
  try {
    // ✅ se já foi acknowledged -> editReply
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload);
    }

    // ✅ caso contrário -> reply normal
    return await interaction.reply({ ...payload, ephemeral: true });
  } catch {
    try {
      return await interaction.followUp({ ...payload, ephemeral: true });
    } catch {
      // ignore
    }
  }
}

async function onlyYou(interaction) {
  const lang = getUserLang(interaction.user.id);

  // ✅ nunca interaction.reply direto
  return safeEditReply(interaction, {
    content: t(lang, "COMMON_ONLY_YOU"),
    embeds: [],
    components: [],
  });
}

function parseMentionOrId(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  const m1 = s.match(/^<@!?(\d+)>$/);
  if (m1) return m1[1];

  const m2 = s.match(/^(\d{10,30})$/);
  if (m2) return m2[1];

  return null;
}

async function openRivalriesMenu(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  setState(staffId, {
    ...st,
    menu: MENU.RIVALRIES_MENU,
    flow: FLOW.NONE,
    pickedUserId: null,
    pendingValueA: null,
    pendingValueB: null,
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# 🧩 👥 ${t(lang, "PROFILE_BTN_RIVALRIES")}`,
        lang === "en-US" ? "Select what you want to edit:" : "Selecione o que deseja editar:",
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN.RIVALRIES_SET_NEMESIS)
      .setLabel(lang === "en-US" ? "Nemesis" : "Carrasco")
      .setEmoji("💀")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(BTN.RIVALRIES_SET_FAVORITE)
      .setLabel(lang === "en-US" ? "Favorite" : "Freguês")
      .setEmoji("☠️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(BTN.RIVALRIES_SET_BESTWIN)
      .setLabel(lang === "en-US" ? "Best win" : "Maior vitória")
      .setEmoji("⚽")
      .setStyle(ButtonStyle.Secondary)
  );

  const rowBack = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN.BACK_MAIN)
      .setLabel(t(lang, "EDITOR_BTN_BACK_MENU"))
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.update({ embeds: [embed], components: [row, rowBack] });
}

async function openRivalryPickUserModal(interaction, flow) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  setState(staffId, {
    ...st,
    menu: MENU.RIVALRIES_PICK_USER,
    flow,
    pickedUserId: null,
    pendingValueA: null,
    pendingValueB: null,
  });

  const title =
    flow === FLOW.NEMESIS
      ? t(lang, "EDITOR_RIVALRIES_PICK_NEMESIS")
      : flow === FLOW.FAVORITE
        ? t(lang, "EDITOR_RIVALRIES_PICK_FAVORITE")
        : t(lang, "EDITOR_RIVALRIES_PICK_OPPONENT");

  const modal = new ModalBuilder().setCustomId(MODAL.RIVALRIES_PICK_USER).setTitle(title);

  const input = new TextInputBuilder()
    .setCustomId("user")
    .setLabel(t(lang, "EDITOR_RIVALRIES_PICK_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(60);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

// ========================================================
// ModalSubmit: PICK USER
// ========================================================
async function handlePickUserModalSubmit(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.flow) return onlyYou(interaction);

  const raw = interaction.fields.getTextInputValue("user");
  const pickedId = parseMentionOrId(raw);

  if (!pickedId) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_INVALID_USER") });
  }

  // valida no servidor
  let member = null;
  try {
    member = await interaction.guild.members.fetch(pickedId);
  } catch {
    member = null;
  }

  if (!member) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_USER_NOT_FOUND") });
  }

  setState(staffId, { ...st, pickedUserId: pickedId });

  const isNemesis = st.flow === FLOW.NEMESIS;
  const isFav = st.flow === FLOW.FAVORITE;

  const continueBtnId = isNemesis
    ? BTN.RIVALRIES_CONTINUE_NEMESIS
    : isFav
      ? BTN.RIVALRIES_CONTINUE_FAVORITE
      : BTN.RIVALRIES_CONTINUE_BESTWIN_FOR;

  const title = isNemesis
    ? (lang === "en-US" ? "Nemesis selected" : "Carrasco selecionado")
    : isFav
      ? (lang === "en-US" ? "Favorite selected" : "Freguês selecionado")
      : (lang === "en-US" ? "Opponent selected" : "Adversário selecionado");

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# ✅ ${title}`,
        ``,
        `👤 ${lang === "en-US" ? "User" : "Usuário"}: <@${pickedId}>`,
        ``,
        lang === "en-US"
          ? "Click **Continue** to set the values."
          : "Clique em **Continuar** para definir os valores.",
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(continueBtnId)
      .setLabel(lang === "en-US" ? "Continue" : "Continuar")
      .setStyle(ButtonStyle.Success)
  );

  return safeEditReply(interaction, {
    embeds: [embed],
    components: [row],
  });
}

// ========================================================
// Nemesis
// ========================================================
async function openNemesisValueModal(interaction) {
  const st = getState(interaction.user.id);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const lang = getUserLang(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId(MODAL.RIVALRIES_NEMESIS_VALUE)
    .setTitle(t(lang, "EDITOR_RIVALRIES_NEMESIS_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(t(lang, "EDITOR_RIVALRIES_NEMESIS_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function handleNemesisValueModalSubmit(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const raw = interaction.fields.getTextInputValue("value");
  const num = Number(raw);

  if (!Number.isFinite(num) || num < 0) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_INVALID_NUMBER") });
  }

  updateStat(st.targetId, "nemesisId", String(st.pickedUserId));
  updateStat(st.targetId, "nemesisLosses", Math.floor(num));

  await logStaffProfileEdit(interaction, {
    staffId,
    targetId: st.targetId,
    field: "nemesis",
    value: `${Math.floor(num)} (${st.pickedUserId})`,
    reason: lang === "en-US" ? "Rivalries editor" : "Editor Rivalidades",
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${lang === "en-US" ? "Nemesis updated." : "Carrasco atualizado."}`,
        `👤 ${lang === "en-US" ? "User" : "Usuário"}: <@${st.pickedUserId}>`,
        `📉 ${lang === "en-US" ? "Losses" : "Derrotas"}: **${Math.floor(num)}**`,
      ].join("\n")
    );

  return safeEditReply(interaction, { embeds: [embed], components: [] });
}

// ========================================================
// Favorite
// ========================================================
async function openFavoriteValueModal(interaction) {
  const st = getState(interaction.user.id);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const lang = getUserLang(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId(MODAL.RIVALRIES_FAVORITE_VALUE)
    .setTitle(t(lang, "EDITOR_RIVALRIES_FAVORITE_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(t(lang, "EDITOR_RIVALRIES_FAVORITE_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function handleFavoriteValueModalSubmit(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const raw = interaction.fields.getTextInputValue("value");
  const num = Number(raw);

  if (!Number.isFinite(num) || num < 0) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_INVALID_NUMBER") });
  }

  updateStat(st.targetId, "favoriteId", String(st.pickedUserId));
  updateStat(st.targetId, "favoriteWins", Math.floor(num));

  await logStaffProfileEdit(interaction, {
    staffId,
    targetId: st.targetId,
    field: "favorite",
    value: `${Math.floor(num)} (${st.pickedUserId})`,
    reason: lang === "en-US" ? "Rivalries editor" : "Editor Rivalidades",
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${lang === "en-US" ? "Favorite updated." : "Freguês atualizado."}`,
        `👤 ${lang === "en-US" ? "User" : "Usuário"}: <@${st.pickedUserId}>`,
        `📈 ${lang === "en-US" ? "Wins" : "Vitórias"}: **${Math.floor(num)}**`,
      ].join("\n")
    );

  return safeEditReply(interaction, { embeds: [embed], components: [] });
}

// ========================================================
// Best win (2-step)
// ========================================================
async function openBestWinGoalsForModal(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  setState(staffId, { ...st, pendingValueA: null });

  const modal = new ModalBuilder()
    .setCustomId(MODAL.RIVALRIES_BESTWIN_FOR)
    .setTitle(t(lang, "EDITOR_RIVALRIES_BESTWIN_FOR_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(t(lang, "EDITOR_RIVALRIES_BESTWIN_FOR_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function handleBestWinForModalSubmit(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const raw = interaction.fields.getTextInputValue("value");
  const num = Number(raw);

  if (!Number.isFinite(num) || num < 0) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_INVALID_NUMBER") });
  }

  setState(staffId, { ...st, pendingValueA: Math.floor(num) });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# ✅ ${lang === "en-US" ? "Step 2/2" : "Etapa 2/2"}`,
        ``,
        lang === "en-US"
          ? "Now click **Continue** to set goals against."
          : "Agora clique em **Continuar** para definir gols sofridos.",
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN.RIVALRIES_CONTINUE_BESTWIN_AGAINST)
      .setLabel(lang === "en-US" ? "Continue" : "Continuar")
      .setStyle(ButtonStyle.Success)
  );

  return safeEditReply(interaction, {
    embeds: [embed],
    components: [row],
  });
}

async function openBestWinGoalsAgainstModal(interaction) {
  const st = getState(interaction.user.id);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const lang = getUserLang(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId(MODAL.RIVALRIES_BESTWIN_AGAINST)
    .setTitle(t(lang, "EDITOR_RIVALRIES_BESTWIN_AGAINST_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(t(lang, "EDITOR_RIVALRIES_BESTWIN_AGAINST_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function handleBestWinAgainstModalSubmit(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId || !st?.pickedUserId) return onlyYou(interaction);

  const raw = interaction.fields.getTextInputValue("value");
  const num = Number(raw);

  if (!Number.isFinite(num) || num < 0) {
    return safeEditReply(interaction, { content: t(lang, "EDITOR_INVALID_NUMBER") });
  }

  const goalsFor = Number(st.pendingValueA ?? 0);
  const goalsAgainst = Math.floor(num);

  updateStat(st.targetId, "bestWinOpponentId", String(st.pickedUserId));
  updateStat(st.targetId, "bestWinGoalsFor", Math.floor(goalsFor));
  updateStat(st.targetId, "bestWinGoalsAgainst", goalsAgainst);

  await logStaffProfileEdit(interaction, {
    staffId,
    targetId: st.targetId,
    field: "bestWin",
    value: `${Math.floor(goalsFor)}x${goalsAgainst} (${st.pickedUserId})`,
    reason: lang === "en-US" ? "Rivalries editor" : "Editor Rivalidades",
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${lang === "en-US" ? "Best win updated." : "Maior vitória atualizada."}`,
        `👤 ${lang === "en-US" ? "Opponent" : "Adversário"}: <@${st.pickedUserId}>`,
        `🏁 ${lang === "en-US" ? "Score" : "Placar"}: **${Math.floor(goalsFor)} x ${goalsAgainst}**`,
      ].join("\n")
    );

  return safeEditReply(interaction, { embeds: [embed], components: [] });
}

// ========================================================
// Rivalries buttons entry
// ========================================================
async function handleRivalriesButton(interaction) {
  const staffId = interaction.user.id;
  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  if (interaction.customId === BTN.RIVALRIES_SET_NEMESIS) return openRivalryPickUserModal(interaction, FLOW.NEMESIS);
  if (interaction.customId === BTN.RIVALRIES_SET_FAVORITE) return openRivalryPickUserModal(interaction, FLOW.FAVORITE);
  if (interaction.customId === BTN.RIVALRIES_SET_BESTWIN) return openRivalryPickUserModal(interaction, FLOW.BESTWIN);

  return safeEditReply(interaction, {
    content: "⚠️ Unknown action.",
    components: [],
    embeds: [],
  });
}

module.exports = {
  FLOW,
  openRivalriesMenu,
  openRivalryPickUserModal,

  // exported for continue buttons
  openNemesisValueModal,
  openFavoriteValueModal,
  openBestWinGoalsForModal,
  openBestWinGoalsAgainstModal,

  handleRivalriesButton,

  handlePickUserModalSubmit,
  handleNemesisValueModalSubmit,
  handleFavoriteValueModalSubmit,
  handleBestWinForModalSubmit,
  handleBestWinAgainstModalSubmit,
};
