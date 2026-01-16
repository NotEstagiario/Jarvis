// src/modules/global/gameplay/gameplay.panel.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const EMOJI_CASUAL = "<:bensa_laughter:1453194053339316346>";
const EMOJI_COMP = "<:bensa_evil:1453193952277827680>";
const EMOJI_EAI = "<:ie_eai:1453188592099786876>";

function buildGameplayPanel() {
  const embed = new EmbedBuilder()
    .setColor(0xcd6f2f) // 13462815
    .setDescription(
      [
        "# ⚔️ Qual seu estilo de jogo?",
        "",
        `Você poderá escolher apenas **1 cargo**, e você terá acesso a uma categoria com bot, chat e voice exclusiva pro seu modo de jogo. ${EMOJI_EAI}`,
        "",
        "-# Para a realização de troca de cargo, por gentileza solicitar a um administrador.",
        "",
        "—",
        "",
        "# ⚔️ What’s your playstyle?",
        "",
        `You can choose only 1 role, and you’ll get access to an exclusive category with bot, chat, and voice for your game mode. ${EMOJI_EAI}`,
        "",
        "-# If you want to change roles, please ask an administrator.",
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("gameplay_set_casual")
      .setLabel("Player Casual")
      .setEmoji(EMOJI_CASUAL)
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("gameplay_set_competitive")
      .setLabel("Player Competitive")
      .setEmoji(EMOJI_COMP)
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

module.exports = { buildGameplayPanel };
