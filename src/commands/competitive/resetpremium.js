// src/commands/competitive/resetpremium.js

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const azyron = require("../../config/azyronIds");
const { t } = require("../../i18n");
const { getDb } = require("../../database/sqlite");

const { canUsePremiumReset } = require("../../modules/global/premium/premiumReset.service");

const EMOJI_PREMIUM = "<:az_premium:1462033257557266497>";
const EMOJI_MEGA = "<:az_mega:1462033319624572958>";

const COLOR_PREMIUM = 0xe2b719;
const COLOR_MEGA = 0xff5dd6;

function getUserLangDb(userId) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT language FROM users WHERE userId = ?").get(userId);
    return row?.language || "pt-BR";
  } catch {
    return "pt-BR";
  }
}

function getPremiumSkin(member) {
  const hasMega = member?.roles?.cache?.has(azyron.roles.megaBooster);
  if (hasMega) return { type: "MEGA", color: COLOR_MEGA, emoji: EMOJI_MEGA };
  return { type: "PREMIUM", color: COLOR_PREMIUM, emoji: EMOJI_PREMIUM };
}

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetpremium")
    .setDescription("Premium: reset your competitive profile (31d cooldown)"),

  async execute(interaction) {
    const member = interaction.member;
    const userId = interaction.user.id;
    const lang = getUserLangDb(userId);

    // canal obrigatório: competitiveProfile
    const allowedChannelId = azyron.channels.competitiveProfile;
    if (interaction.channelId !== allowedChannelId) {
      const mention = `<#${allowedChannelId}>`;
      return interaction.reply({
        ephemeral: true,
        content:
          lang === "en-US"
            ? `⚠️ You can only use this command in ${mention}.`
            : `⚠️ Você só pode usar esse comando no canal ${mention}.`,
      });
    }

    // role competitivo obrigatório
    const isCompetitive = member?.roles?.cache?.has(azyron.roles.competitive);
    if (!isCompetitive) {
      return interaction.reply({
        ephemeral: true,
        content: t(lang, "premiumReset.notCompetitive"),
      });
    }

    // premium / mega
    const hasPremium = member?.roles?.cache?.has(azyron.roles.premium);
    const hasMega = member?.roles?.cache?.has(azyron.roles.megaBooster);
    const hasAny = hasPremium || hasMega;

    // ========================================================
    // ✅ COOLdown ativo? -> embed com timer AO VIVO e fim.
    // ✅ Presidente possui bypass total (testes)
    // ========================================================
    if (!isPresident(userId)) {
      const cd = canUsePremiumReset(userId);
      if (!cd.ok) {
        const skin = getPremiumSkin(member);
        const unix = Math.floor(cd.nextAt / 1000);

        const embed = new EmbedBuilder()
          .setColor(skin.color)
          .setDescription(
            t(lang, "premiumReset.cooldownEmbed", {
              emoji: skin.emoji,
              whenFull: `<t:${unix}:F>`,
              whenRelative: `<t:${unix}:R>`,
            })
          );

        return interaction.reply({
          ephemeral: true,
          embeds: [embed],
        });
      }
    }

    // ========================================================
    // SEM PREMIUM/MEGA -> Embed No Access + 1 botão Premium
    // ========================================================
    if (!hasAny) {
      const embed = new EmbedBuilder()
        .setColor(COLOR_PREMIUM)
        .setDescription(t(lang, "premiumReset.noAccessEmbed"));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("resetpremium_premium")
          .setLabel(t(lang, "premiumReset.btn.premium"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI_PREMIUM)
      );

      return interaction.reply({
        ephemeral: true,
        embeds: [embed],
        components: [row],
      });
    }

    // ========================================================
    // COM PREMIUM/MEGA -> Embed Confirm + botões Sim/Não
    // ========================================================
    const skin = getPremiumSkin(member);

    const embed = new EmbedBuilder()
      .setColor(skin.color)
      .setDescription(
        t(lang, "premiumReset.confirmEmbed", {
          emoji: skin.emoji,
        })
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("resetpremium_confirm_yes")
        .setLabel(lang === "en-US" ? "Yes" : "Sim")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("resetpremium_confirm_no")
        .setLabel(lang === "en-US" ? "No" : "Não")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      ephemeral: true,
      embeds: [embed],
      components: [row],
    });
  },
};
