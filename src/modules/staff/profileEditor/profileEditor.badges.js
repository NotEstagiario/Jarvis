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
  return safeFollowUp(interaction, { content: t(lang, "COMMON_ONLY_YOU") });
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
  if (!st?.targetId) {
    // aqui é botão do wizard (não selectMenu), então pode reply normal
    return interaction.reply({ ephemeral: true, content: t(lang, "COMMON_ONLY_YOU") });
  }

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

  // badges atuais do DB
  let current = [];
  try {
    const { getCompetitiveProfile } = require("../../global/profiles/profile.service");
    const p = getCompetitiveProfile(st.targetId);

    const parsed = safeJsonParse(p?.badgesJson || "[]", []);
    current = Array.isArray(parsed) ? parsed : [];
  } catch {
    current = [];
  }

  current = unique(current.filter(Boolean)).slice(0, 25);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("editprofile_badges_select")
    .setPlaceholder(
      hasCatalog ? t(lang, "EDITOR_BADGES_SELECT_PLACEHOLDER") : t(lang, "EDITOR_BADGES_SELECT_SOON")
    )
    .setMinValues(0)
    .setMaxValues(hasCatalog ? Math.min(25, badges.length) : 1)
    .setDisabled(!hasCatalog);

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
// - router já fez deferUpdate()
// - aqui aplica badges + mantém UI + manda confirmação ephemeral
// ========================================================
async function handleBadgesSelect(interaction) {
  const staffId = interaction.user.id;
  const lang = getUserLang(staffId);

  const st = getState(staffId);
  if (!st?.targetId) return onlyYou(interaction);

  const badges = getBadges();
  const hasCatalog = Array.isArray(badges) && badges.length > 0;

  if (!hasCatalog) {
    return safeEditReply(interaction, {
      embeds: [],
      components: interaction.message.components,
    });
  }

  const picked = interaction.values || [];
  const list = unique(picked.filter(Boolean)).slice(0, 25);

  updateStat(st.targetId, "badgesJson", JSON.stringify(list));

  // mantém painel
  await safeEditReply(interaction, {
    embeds: interaction.message.embeds,
    components: interaction.message.components,
  });

  // confirmação ephemeral
  const doneEmbed = new EmbedBuilder()
    .setColor(COLOR)
    .setDescription(
      [
        `✅ ${lang === "en-US" ? "Badges updated." : "Insígnias atualizadas."}`,
        ``,
        `📌 ${lang === "en-US" ? "Total selected" : "Total selecionadas"}: **${list.length}**`,
      ].join("\n")
    );

  return safeFollowUp(interaction, { embeds: [doneEmbed] });
}

module.exports = {
  openBadgesMenu,
  handleBadgesSelect,
};
