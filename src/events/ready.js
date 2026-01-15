/**
 * src/events/ready.js
 *
 * =========================================================
 *  ✅ READY EVENT (Auto-Setup do servidor)
 * =========================================================
 * [CRÍTICO]
 * - Aqui o bot garante que painéis essenciais existam.
 * - Se alguém apagar uma mensagem fixa, o bot recria.
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const {
  BOT_NAME,
  GAMEPLAY_CHANNEL_ID,
  LANGUAGE_CHANNEL_ID,
  EMBED_FOOTER
} = require("../config/constants");

const { ensureFixedPanel } = require("../services/fixedPanelService");

const { startSchedulers } = require("../services/schedulerService");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`[${BOT_NAME}] ✅ Bot online como ${client.user.tag}`);

    // =========================================================
    // 🌍 Painel fixo: Idioma do bot
    // =========================================================
    const langEmbed = new EmbedBuilder()
      .setColor(16757504)
      .setDescription(`# 🌍 Escolha o idioma do bot

Clique em um botão para definir seu idioma.

🇧🇷 **Português** (**PT-BR**)
🇺🇸 **English** (**EN**)

Isso salva o idioma no seu perfil e o bot passa a responder nesse idioma.
-# Após escolher um idioma, você só poderá alterar novamente após 24 horas.

____________

# 🌍 Choose the bot language

Click a button to set your language.

🇧🇷 **Português** (**PT-BR**)
🇺🇸 **English** (**EN**)

This will save the language to your profile and the bot will respond in that language.
-# After selecting a language, you can only change it again after 24 hours.`
      )
      .setFooter({ text: EMBED_FOOTER });

    const langRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lang_pick_ptbr")
        .setLabel("Português")
        .setEmoji("🇧🇷")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("lang_pick_en")
        .setLabel("English")
        .setEmoji("🇺🇸")
        .setStyle(ButtonStyle.Primary),
    );

    // =========================================================
    // ⚔️ Painel fixo: Gameplay (Casual/Competitivo)
    // =========================================================
    const gameplayEmbed = new EmbedBuilder()
      .setColor(16758784)
      .setDescription(`# ⚔️ Qual seu estilo de jogo?

Você poderá escolher apenas **1 cargo**, e você terá acesso a uma categoria com bot, chat e voice exclusiva pro seu modo de jogo. <:eai:1453188592099786876>

-# Para a realização de troca de cargo, por gentileza solicitar a um administrador.`
      )
      .setFooter({ text: EMBED_FOOTER });

    const gameplayRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("gp_pick_casual")
        .setLabel("Player Casual")
        .setEmoji("<:bensa_laughter:1453194053339316346>")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("gp_pick_competitive")
        .setLabel("Player Competitive")
        .setEmoji("<:bensa_evil:1453193952277827680>")
        .setStyle(ButtonStyle.Primary),
    );

    // =========================================================
    // 🔁 AUTO-SETUP: recriar se apagarem
    // =========================================================
    for (const guild of client.guilds.cache.values()) {
      await ensureFixedPanel({
        guild,
        channelId: LANGUAGE_CHANNEL_ID,
        key: "LANGUAGE_PANEL",
        payload: { embeds: [langEmbed], components: [langRow] },
      }).catch(() => {});

      await ensureFixedPanel({
        guild,
        channelId: GAMEPLAY_CHANNEL_ID,
        key: "GAMEPLAY_PANEL",
        payload: { embeds: [gameplayEmbed], components: [gameplayRow] },
      }).catch(() => {});
    }
  }
};
