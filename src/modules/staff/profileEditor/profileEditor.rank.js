// src/modules/staff/profileEditor/profileEditor.rank.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { t } = require("../../../i18n");
const { getUserLang } = require("../../../utils/lang");

const { getState, setState } = require("./profileEditor.state");
const { BTN } = require("./profileEditor.constants");

const { safeSetEmoji } = require("../../../utils/emoji");

const { getRanks, getRankLabel, getRankEmoji } = require("../../global/ranks/ranks.catalog");
const { setSeasonRankStaff } = require("../../global/ranks/ranks.service");

const { logStaffProfileEdit } = require("./profileEditor.logger");

const COLOR = 0xe2b719;

// ========================================================
// Helpers ACK-safe
// - selectMenus.router já fez deferUpdate()
// - aqui é proibido reply/defer, só editReply + followUp
// ========================================================
async function safeEditReply(interaction, payload) {
  try {
    return await interaction.editReply(payload);
  } catch (err) {
    const code = err?.code;
    if (code === 10062 || code === 40060) return null;

    try {
      return await interaction.followUp({ ...payload, ephemeral: true });
    } catch {
      return null;
    }
  }
}

async function safeFollowUp(interaction, payload) {
  try {
    return await interaction.followUp({ ...payload, ephemeral: true });
  } catch (err) {
    const code = err?.code;
    if (code === 10062 || code === 40060) return null;
    return null;
  }
}

async function onlyYou(interaction) {
  const lang = getUserLang(interaction.user.id);
  return safeFollowUp(interaction, {
    content: t(lang, "COMMON_ONLY_YOU"),
  });
}

// ========================================================
// openRankMenu
// - selector de rank real (seasonRank)
// ========================================================
async function openRankMenu(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) {
    // aqui é botão do wizard (não selectMenu), então pode reply normal
    return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
  }

  setState(staffId, { ...st, menu: "RANK_MENU", flow: "RANK" });

  const ranks = getRanks();

  // rank atual do DB
  let currentRankId = "unranked";
  try {
    const { getCompetitiveProfile } = require("../../global/profiles/profile.service");
    const p = getCompetitiveProfile(st.targetId);
    currentRankId = String(p?.seasonRank || "unranked").toLowerCase();
  } catch {
    currentRankId = "unranked";
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# 🏅 ${t(lang, "EDITOR_RANK_TITLE")}`,
        ``,
        t(lang, "EDITOR_RANK_DESC"),
        ``,
        `📌 ${t(lang, "EDITOR_RANK_CURRENT")}: **${getRankLabel(lang, currentRankId)}**`,
      ].join("\n")
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("editprofile_rank_select")
    .setPlaceholder(t(lang, "EDITOR_RANK_SELECT_PLACEHOLDER"))
    .setMinValues(1)
    .setMaxValues(1);

  for (const r of ranks) {
    const label = getRankLabel(lang, r.id);

    const opt = new StringSelectMenuOptionBuilder()
      .setLabel(String(label).slice(0, 100))
      .setValue(String(r.id))
      .setDefault(String(r.id).toLowerCase() === String(currentRankId).toLowerCase());

    safeSetEmoji(opt, getRankEmoji(r.id));
    menu.addOptions(opt);
  }

  const rowSelect = new ActionRowBuilder().addComponents(menu);

  const rowBack = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN.BACK_MAIN)
      .setLabel(t(lang, "EDITOR_BTN_BACK_MENU"))
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.update({
    embeds: [embed],
    components: [rowSelect, rowBack],
  });
}

// ========================================================
// handleRankSelect (selectMenus.router)
// - router já fez deferUpdate()
// - aqui aplica rank + atualiza painel + manda confirmação ephemeral + LOG
// ========================================================
async function handleRankSelect(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  const picked = String(interaction.values?.[0] || "unranked").toLowerCase();

  // rank antigo (pra log)
  let beforeRankId = "unranked";
  try {
    const { getCompetitiveProfile } = require("../../global/profiles/profile.service");
    const p = getCompetitiveProfile(st.targetId);
    beforeRankId = String(p?.seasonRank || "unranked").toLowerCase();
  } catch {
    beforeRankId = "unranked";
  }

  // valida membro
  let targetMember = null;
  try {
    targetMember = await interaction.guild.members.fetch(st.targetId);
  } catch {
    targetMember = null;
  }

  // ✅ aplica rank + cargos
  await setSeasonRankStaff({
    guild: interaction.guild,
    targetMember,
    targetUserId: st.targetId,
    rankId: picked,
  });

  // ✅ LOG DA ALTERAÇÃO
  try {
    await logStaffProfileEdit(interaction, {
      staffId,
      targetId: st.targetId,
      field: "seasonRank",
      value: `${beforeRankId} -> ${picked}`,
      reason: lang === "en-US" ? "Profile editor — Rank select" : "Editor de Perfil — Rank select",
    });
  } catch {
    // não trava o fluxo
  }

  // ✅ atualiza embed do painel
  const panelEmbed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# 🏅 ${t(lang, "EDITOR_RANK_TITLE")}`,
        ``,
        t(lang, "EDITOR_RANK_DESC"),
        ``,
        `📌 ${t(lang, "EDITOR_RANK_CURRENT")}: **${getRankLabel(lang, picked)}**`,
      ].join("\n")
    );

  await safeEditReply(interaction, {
    embeds: [panelEmbed],
    components: interaction.message.components,
  });

  // ✅ confirmação ephemeral
  const done = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${t(lang, "EDITOR_RANK_DONE")}`,
        ``,
        `🏅 ${t(lang, "EDITOR_RANK_CURRENT")}: **${getRankEmoji(picked)} ${getRankLabel(lang, picked)}**`,
        ``,
        t(lang, "EDITOR_RANK_DONE_HINT"),
      ].join("\n")
    );

  return safeFollowUp(interaction, { embeds: [done] });
}

module.exports = {
  openRankMenu,
  handleRankSelect,
};
