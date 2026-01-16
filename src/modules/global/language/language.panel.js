// src/modules/global/language/language.panel.js

// ========================================================
// Painel fixo de idioma (PT/EN)
//
// ⚠️ REGRA ABSOLUTA:
// A embed DEVE ser exatamente a embed fornecida no Word.
// Não inventar textos, não mudar layout.
//
// Requisitos adicionais (Word/prática):
// ✅ Botão PT-BR verde
// ✅ Botão EN azul
// ========================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function buildLanguagePanel() {
  const embed = new EmbedBuilder()
    .setColor(16757504)
    .setDescription(
      [
        "# 🌍 Escolha o idioma do bot",
        "",
        "Clique em um botão para definir seu idioma.",
        "",
        "🇧🇷 **Português (PT-BR)**",
        "🇺🇸 **English (EN)**",
        "",
        "Isso salva o idioma no seu perfil e o bot passa a responder nesse idioma.",
        "Após escolher um idioma, você só poderá alterar novamente após 24 horas.",
        "",
        "—",
        "",
        "# 🌍 Choose the bot language",
        "",
        "Click a button to set your language.",
        "",
        "🇧🇷 **Português (PT-BR)**",
        "🇺🇸 **English (EN)**",
        "",
        "This will save the language to your profile and the bot will respond in that language.",
        "After selecting a language, you can only change it again after 24 hours."
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lang_set_pt")
      .setLabel("Português")
      .setEmoji("🇧🇷")
      .setStyle(ButtonStyle.Success), // ✅ verde (Brasil)

    new ButtonBuilder()
      .setCustomId("lang_set_en")
      .setLabel("English")
      .setEmoji("🇺🇸")
      .setStyle(ButtonStyle.Primary) // ✅ azul (English)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { buildLanguagePanel };
