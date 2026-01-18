// src/modules/staff/profileEditor/profileEditor.badges.js

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

const { updateStat } = require("./profileEditor.service");

const { getBadges } = require("../../global/badges/badges.catalog");

const COLOR = 0xe2b719;

function onlyYou(interaction) {
  const lang = getUserLang(interaction.user.id);
  return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
}

function safeJsonParse(str, fallback) {
  try {
    const x = JSON.parse(str);
    return x ?? fallback;
  } catch {
    return fallback;
  }
}

function unique(arr) {
  return [...new Set(arr)];
}

async function openBadgesMenu(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  setState(staffId, { ...st, menu: "BADGES_MENU", flow: "BADGES" });

  const badges = getBadges();
  const hasCatalog = Array.isArray(badges) && badges.length > 0;

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `# 🧩 💎 ${t(lang, "PROFILE_BTN_BADGES")}`,
        ``,
        t(lang, "EDITOR_BADGES_SELECT_DESC"),
      ].join("\n")
    );

  // ========================================================
  // Carrega badges atuais do DB (badgesJson)
  // ========================================================
  let current = [];
  try {
    const { getCompetitiveProfile } = require("../../global/profiles/profile.service");
    const p = getCompetitiveProfile(st.targetId);
    current = Array.isArray(safeJsonParse(p?.badgesJson || "[]", []))
      ? safeJsonParse(p?.badgesJson || "[]", [])
      : [];
  } catch {
    current = [];
  }

  current = unique(current.filter(Boolean)).slice(0, 25);

  // ========================================================
  // MENU (sempre aparece, mesmo vazio)
  // ========================================================
  const menu = new StringSelectMenuBuilder()
    .setCustomId("editprofile_badges_select")
    .setPlaceholder(hasCatalog ? t(lang, "EDITOR_BADGES_SELECT_PLACEHOLDER") : t(lang, "EDITOR_BADGES_SELECT_SOON"))
    .setMinValues(0)
    .setMaxValues(hasCatalog ? Math.min(25, badges.length) : 1)
    .setDisabled(!hasCatalog);

  // catálogo vazio => 1 option fake (discord exige option)
  if (!hasCatalog) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(lang === "en-US" ? "No badges yet" : "Nenhuma insígnia ainda")
        .setValue("soon_badges")
        .setDescription(
          lang === "en-US"
            ? "This selector will be enabled soon."
            : "Esse seletor será habilitado em breve."
        )
    );
  } else {
    for (const badge of badges.slice(0, 25)) {
      const label = badge?.name?.[lang] || badge?.name?.["pt-BR"] || badge?.id || "Badge";
      const desc =
        badge?.description?.[lang] ||
        badge?.description?.["pt-BR"] ||
        (lang === "en-US" ? "Badge" : "Insígnia");

      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(String(label).slice(0, 100))
        .setValue(String(badge.id))
        .setDescription(String(desc).slice(0, 100));

      if (badge?.emoji) opt.setEmoji(badge.emoji);
      if (current.includes(badge.id)) opt.setDefault(true);

      menu.addOptions(opt);
    }
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
// handleBadgesSelect (selectMenus.router)
// ✅ FIX 40060: deferUpdate + editReply
// ========================================================
async function handleBadgesSelect(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  // catálogo vazio => ignora (só estética)
  const badges = getBadges();
  const hasCatalog = Array.isArray(badges) && badges.length > 0;
  if (!hasCatalog) {
    // ⚠️ select menu em geral é melhor usar deferUpdate, nunca reply aqui
    try {
      await interaction.deferUpdate();
      return interaction.editReply({
        embeds: [],
        components: interaction.message.components,
      });
    } catch {
      return;
    }
  }

  // ✅ SEMPRE deferUpdate primeiro (evita "interaction failed")
  await interaction.deferUpdate();

  const picked = interaction.values || [];
  const list = unique(picked.filter(Boolean)).slice(0, 25);

  updateStat(st.targetId, "badgesJson", JSON.stringify(list));

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${lang === "en-US" ? "Badges updated." : "Insígnias atualizadas."}`,
        ``,
        `📌 ${lang === "en-US" ? "Total selected" : "Total selecionadas"}: **${list.length}**`,
      ].join("\n")
    );

  return interaction.editReply({
    embeds: [embed],
    components: interaction.message.components,
  });
}

module.exports = {
  openBadgesMenu,
  handleBadgesSelect,
};
