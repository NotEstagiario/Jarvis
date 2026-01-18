// src/modules/staff/profileEditor/profileEditor.ui.js

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

const { getCompetitiveProfile } = require("../../global/profiles/profile.service");

const { getState, setState } = require("./profileEditor.state");
const { MENU, SECTIONS, BTN, MODAL } = require("./profileEditor.constants");

const {
  formatEditorValue,
  getSectionStats,
  buildStatButtonLabel,
  getAllowedKeys,
  sectionTitle,
  sectionEmoji,
  EMOJI_TAB_PLAYER,
  EMOJI_TAB_BADGES,
  EMOJI_TAB_MATCHES,
  EMOJI_TAB_GOALS,
  EMOJI_TAB_RIVALRIES,
} = require("./profileEditor.ui.helpers");

const { updateStat } = require("./profileEditor.service");
const { logStaffProfileEdit } = require("./profileEditor.logger");

// flows
const { openBadgesMenu } = require("./profileEditor.badges");
const { openRivalriesMenu } = require("./profileEditor.rivalries");
const { openRankMenu } = require("./profileEditor.rank");

const { safeSetEmoji } = require("../../../utils/emoji");

const IMAGE_URL =
  "https://media.discordapp.net/attachments/614919954604490798/1462079614263230660/canvass.png?format=webp&quality=lossless&";

const COLOR = 0xe2b719;

function onlyYou(interaction) {
  const lang = getUserLang(interaction.user.id);
  return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
}

function pushRowIfValid(rows, row) {
  if (!row) return;
  try {
    const len = row.components?.length || 0;
    if (len >= 1 && len <= 5) rows.push(row);
  } catch {}
}

function isComponentInteraction(interaction) {
  return interaction?.isButton?.() || interaction?.isStringSelectMenu?.() || interaction?.isAnySelectMenu?.();
}

// ========================================================
// MAIN MENU (TempVoice style)
// - botões só emoji
// - imagem só aqui
// ========================================================
async function openEditorMainMenu(interaction, { staffId, targetId }) {
  const lang = getUserLang(staffId);

  setState(staffId, {
    menu: MENU.MAIN,
    staffId,
    targetId,
    section: null,
    statKey: null,
    pendingValue: null,

    // flows
    flow: null,
    pickedUserId: null,
    pendingValueA: null,
    pendingValueB: null,
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setImage(IMAGE_URL)
    .setDescription(t(lang, "EDITOR_MAIN_DESC"));

  // ✅ estilo TempVoice: botões só emoji
  const row = new ActionRowBuilder().addComponents(
    safeSetEmoji(
      new ButtonBuilder().setCustomId(BTN.MAIN_PLAYER).setStyle(ButtonStyle.Secondary),
      EMOJI_TAB_PLAYER
    ),
    safeSetEmoji(
      new ButtonBuilder().setCustomId(BTN.MAIN_BADGES).setStyle(ButtonStyle.Secondary),
      EMOJI_TAB_BADGES
    ),
    safeSetEmoji(
      new ButtonBuilder().setCustomId(BTN.MAIN_MATCHES).setStyle(ButtonStyle.Secondary),
      EMOJI_TAB_MATCHES
    ),
    safeSetEmoji(
      new ButtonBuilder().setCustomId(BTN.MAIN_GOALS).setStyle(ButtonStyle.Secondary),
      EMOJI_TAB_GOALS
    ),
    safeSetEmoji(
      new ButtonBuilder().setCustomId(BTN.MAIN_RIVALRIES).setStyle(ButtonStyle.Secondary),
      EMOJI_TAB_RIVALRIES
    )
  );

  if (isComponentInteraction(interaction)) {
    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp({ ephemeral: true, embeds: [embed], components: [row], fetchReply: true });
  }
  return interaction.reply({ ephemeral: true, embeds: [embed], components: [row], fetchReply: true });
}

// ========================================================
// STAT PICKER MENU (sem imagem)
// ========================================================
async function openStatPicker(interaction, section) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st) return onlyYou(interaction);

  // flows especiais
  if (section === SECTIONS.BADGES) return openBadgesMenu(interaction);
  if (section === SECTIONS.RIVALRIES) return openRivalriesMenu(interaction);

  setState(staffId, { ...st, menu: MENU.PICK_STAT, section, statKey: null, pendingValue: null });

  const stats = getSectionStats(section);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_PICK_STAT_DESC", {
        section: `${sectionEmoji(section)} ${sectionTitle(lang, section)}`,
      })
    );

  const rows = [];
  let current = new ActionRowBuilder();

  for (const s of stats) {
    if (current.components.length >= 5) {
      pushRowIfValid(rows, current);
      current = new ActionRowBuilder();
    }

    const custom = `${BTN.PICK_PREFIX}${s.key}`;

    const btn = new ButtonBuilder()
      .setCustomId(custom)
      .setLabel(buildStatButtonLabel(lang, s))
      .setStyle(ButtonStyle.Secondary);

    safeSetEmoji(btn, s.emoji || "📌");
    current.addComponents(btn);
  }

  pushRowIfValid(rows, current);

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(BTN.BACK_MAIN)
        .setLabel(t(lang, "EDITOR_BTN_BACK_MENU"))
        .setStyle(ButtonStyle.Danger)
    )
  );

  if (isComponentInteraction(interaction)) {
    return interaction.update({ embeds: [embed], components: rows });
  }

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp({ ephemeral: true, embeds: [embed], components: rows, fetchReply: true });
  }
  return interaction.reply({ ephemeral: true, embeds: [embed], components: rows, fetchReply: true });
}

// ========================================================
// EDITOR MENU (sem imagem)
// ========================================================
async function openEditor(interaction, statKey) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st) return onlyYou(interaction);

  const allowed = getAllowedKeys();

  // ✅ seasonRank não edita numericamente, vira selector flow
  if (statKey === "seasonRank" || statKey === "seasonRank_selector") {
    return openRankMenu(interaction);
  }

  // ✅ rivalries sempre flow
  if (statKey === "rivalries_flow") {
    return openRivalriesMenu(interaction);
  }

  // ✅ badgesJson é flow
  if (statKey === "badgesJson") {
    return openBadgesMenu(interaction);
  }

  if (!allowed.includes(statKey)) {
    return interaction.reply({
      ephemeral: true,
      content: lang === "en-US" ? "⚠️ This stat cannot be edited." : "⚠️ Esta estatística não pode ser editada.",
    });
  }

  setState(staffId, { ...st, menu: MENU.EDIT, statKey, pendingValue: null });

  const profile = getCompetitiveProfile(st.targetId);
  const currentValue = Number(profile?.[statKey] ?? 0);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_EDIT_DESC", {
        stat: `\`${statKey}\``,
        value: formatEditorValue(currentValue),
      })
    );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.ACT_PLUS_100).setLabel("+100").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.ACT_PLUS_10).setLabel("+10").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.ACT_PLUS_5).setLabel("+5").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.ACT_ZERO).setLabel(t(lang, "EDITOR_BTN_ZERO")).setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.ACT_MINUS_100).setLabel("-100").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(BTN.ACT_MINUS_10).setLabel("-10").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(BTN.ACT_MINUS_5).setLabel("-5").setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(BTN.ACT_SET_CUSTOM)
      .setLabel(t(lang, "EDITOR_BTN_SET_VALUE"))
      .setStyle(ButtonStyle.Primary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.CONFIRM).setLabel(t(lang, "EDITOR_BTN_CONFIRM")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.BACK_STATS).setLabel(t(lang, "EDITOR_BTN_BACK")).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.BACK_MAIN).setLabel(t(lang, "EDITOR_BTN_BACK_MENU")).setStyle(ButtonStyle.Danger)
  );

  return interaction.update({ embeds: [embed], components: [row1, row2, row3] });
}

// ========================================================
// MODALS
// ========================================================
async function openModalSetCustom(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const modal = new ModalBuilder().setCustomId(MODAL.SET_CUSTOM).setTitle(t(lang, "EDITOR_MODAL_SET_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(t(lang, "EDITOR_MODAL_SET_LABEL"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function openModalJustify(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const modal = new ModalBuilder().setCustomId(MODAL.JUSTIFY).setTitle(t(lang, "EDITOR_MODAL_JUSTIFY_TITLE"));

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel(t(lang, "EDITOR_MODAL_JUSTIFY_LABEL"))
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(300);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

// ========================================================
// EDIT ACTIONS
// ========================================================
async function applyDelta(interaction, delta) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.statKey) return onlyYou(interaction);

  const profile = getCompetitiveProfile(st.targetId);
  const current = Number(profile?.[st.statKey] ?? 0);
  const next = current + delta;

  setState(staffId, { ...st, pendingValue: next });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_PENDING_DESC", {
        stat: `\`${st.statKey}\``,
        value: formatEditorValue(next),
      })
    );

  return interaction.update({ embeds: [embed], components: interaction.message.components });
}

async function applyZero(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.statKey) return onlyYou(interaction);

  setState(staffId, { ...st, pendingValue: 0 });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_PENDING_DESC", {
        stat: `\`${st.statKey}\``,
        value: formatEditorValue(0),
      })
    );

  return interaction.update({ embeds: [embed], components: interaction.message.components });
}

async function handleModalSetCustom(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.statKey) return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ERROR_GENERIC") });

  const raw = interaction.fields.getTextInputValue("value");
  const num = Number(raw);

  if (!Number.isFinite(num)) {
    return interaction.reply({ ephemeral: true, content: t(lang, "EDITOR_INVALID_NUMBER") });
  }

  setState(staffId, { ...st, pendingValue: num });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_PENDING_DESC", {
        stat: `\`${st.statKey}\``,
        value: formatEditorValue(num),
      })
    );

  return interaction.reply({ ephemeral: true, embeds: [embed] });
}

async function handleModalJustify(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.statKey) return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ERROR_GENERIC") });

  const reason = interaction.fields.getTextInputValue("reason");
  const value = st.pendingValue;

  if (!Number.isFinite(Number(value))) {
    return interaction.reply({ ephemeral: true, content: t(lang, "EDITOR_NO_VALUE") });
  }

  updateStat(st.targetId, st.statKey, Number(value));

  // ✅ log staff (helper unificado)
  await logStaffProfileEdit(interaction, {
    staffId,
    targetId: st.targetId,
    field: st.statKey,
    value,
    reason,
  });

  const doneEmbed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      t(lang, "EDITOR_DONE_DESC", {
        stat: `\`${st.statKey}\``,
        value: formatEditorValue(Number(value)),
      })
    );

  return interaction.reply({ ephemeral: true, embeds: [doneEmbed] });
}

module.exports = {
  openEditorMainMenu,
  openStatPicker,
  openEditor,
  openModalSetCustom,
  openModalJustify,
  applyDelta,
  applyZero,
  handleModalSetCustom,
  handleModalJustify,
};
