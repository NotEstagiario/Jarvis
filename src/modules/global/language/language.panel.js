// src/modules/global/language/language.panel.js

// ========================================================
// Language Panel (FIXO)
// Regras:
// - Ao iniciar: verificar se existe (SEM SPAM)
// - Se apagaram a msg, repostar
// - /painelidioma = apenas staff caso necessário
// ========================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const logger = require("../../../core/logger");
const azyron = require("../../../config/azyronIds");

const { savePanelMessage, getPanelMessage } = require("./language.service");

// chave do painel no banco
const PANEL_KEY = "language_panel";

function buildLanguagePanelPayload() {
  const embedJson = {
    flags: 0,
    color: 13462815,
    type: "rich",
    description:
      "# 🌍 Escolha o idioma do bot\n\n" +
      "Clique em um botão para definir seu idioma.\n\n" +
      "🇧🇷 **Português (PT-BR)**\n" +
      "🇺🇸 **English (EN)**\n\n" +
      "Isso salva o idioma no seu perfil e o bot passa a responder nesse idioma.\n" +
      "Após escolher um idioma, você só poderá alterar novamente após 24 horas.\n\n" +
      "—\n\n" +
      "# 🌍 Choose the bot language\n\n" +
      "Click a button to set your language.\n\n" +
      "🇧🇷 **Português (PT-BR)**\n" +
      "🇺🇸 **English (EN)**\n\n" +
      "This will save the language to your profile and the bot will respond in that language.\n" +
      "After selecting a language, you can only change it again after 24 hours.",
  };

  const embed = new EmbedBuilder(embedJson);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lang_set_ptbr")
      .setLabel("Português")
      .setEmoji("🇧🇷")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("lang_set_enus")
      .setLabel("English")
      .setEmoji("🇺🇸")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

async function ensureLanguagePanel(client) {
  const channelId = azyron.channels.language;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const saved = getPanelMessage(PANEL_KEY);

  // 1) se tem messageId salvo, tenta buscar ela (isso elimina spam)
  if (saved?.messageId) {
    const existing = await channel.messages.fetch(saved.messageId).catch(() => null);
    if (existing) {
      return false;
    }
  }

  // 2) fallback: procurar nas últimas mensagens
  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  if (recent) {
    const found = recent.find((m) => {
      if (m.author?.id !== client.user.id) return false;
      const desc = m.embeds?.[0]?.description || "";
      return desc.includes("Escolha o idioma do bot") && desc.includes("Choose the bot language");
    });

    if (found) {
      savePanelMessage(PANEL_KEY, channelId, found.id);
      return false;
    }
  }

  // 3) se não existe, posta e salva ID
  const payload = buildLanguagePanelPayload();
  const msg = await channel.send(payload);

  savePanelMessage(PANEL_KEY, channelId, msg.id);
  logger.info("[PANELS] ✅ Painel idioma postado automaticamente.");
  return true;
}

module.exports = {
  buildLanguagePanelPayload,
  ensureLanguagePanel,
};
