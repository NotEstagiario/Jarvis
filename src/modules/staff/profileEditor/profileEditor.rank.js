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

const COLOR = 0xe2b719;

function onlyYou(interaction) {
  const lang = getUserLang(interaction.user.id);
  return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
}

// ========================================================
// openRankMenu
// - selector de rank real (seasonRank)
// - salva no DB e aplica cargos
// ========================================================
async function openRankMenu(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

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

  // ✅ interaction.update aqui é OK porque é instantâneo (sem await pesado)
  return interaction.update({
    embeds: [embed],
    components: [rowSelect, rowBack],
  });
}

// ========================================================
// handleRankSelect (selectMenus.router)
// ⚠️ IMPORTANTE: select menu tem timeout curto (~3s)
// então PRECISA deferUpdate no começo
// ========================================================
async function handleRankSelect(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  // ✅ evita "This interaction failed" se algo demorar
  await interaction.deferUpdate();

  const picked = String(interaction.values?.[0] || "unranked").toLowerCase();

  // valida membro
  let targetMember = null;
  try {
    targetMember = await interaction.guild.members.fetch(st.targetId);
  } catch {
    targetMember = null;
  }

  // ✅ atualiza rank + xp mínimo + cargos
  await setSeasonRankStaff({
    guild: interaction.guild,
    targetMember,
    targetUserId: st.targetId,
    rankId: picked,
  });

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

  // ✅ depois do deferUpdate, o jeito certo é editReply
  return interaction.editReply({
    embeds: [done],
    components: interaction.message.components,
  });
}

module.exports = {
  openRankMenu,
  handleRankSelect,
};
