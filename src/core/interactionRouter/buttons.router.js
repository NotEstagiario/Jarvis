// src/core/interactionRouter/buttons.router.js

// ========================================================
// Buttons Router - Jarvis
//
// ⚠️ CRÍTICO:
// Este router recebe TODOS botões clicados no servidor.
//
// Regras importantes:
// ✅ Botões de comandos que usam Collector devem ser IGNORADOS aqui
//    (ex.: /perfil e /analisarperfil) -> o próprio comando trata no collector.
// ❌ Se o router responder primeiro, o collector quebra (Unknown interaction)
//
// ✅ Aqui entram botões globais do sistema:
// - painel idioma PT/EN (v1.2)
// - (futuro) botões /desafiar, /resultado etc
// ========================================================

const logger = require("../logger");
const { MessageFlags } = require("discord.js");

const { t } = require("../../i18n");
const { getUserLang } = require("../../utils/lang");

const {
  setUserLanguage,
  canChangeLanguage,
} = require("../../modules/global/language/language.service");

// ========================================================
// Utils
// ========================================================

function formatTimeLeft(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// ========================================================
// Router
// ========================================================

module.exports = async (interaction) => {
  const id = interaction.customId;

  // ========================================================
  // ✅ BOTÕES LOCAIS (Collectors) — IGNORAR
  // ========================================================
  // /perfil e /analisarperfil usam collector com customId prefix "profile_"
  if (id.startsWith("profile_")) {
    return; // deixa o collector do comando tratar
  }

  // ========================================================
  // 🌐 Painel de idioma (v1.2)
  // ========================================================
  if (id === "lang_set_pt" || id === "lang_set_en") {
    const userId = interaction.user.id;

    // idioma atual do usuário (antes de alterar)
    const lang = getUserLang(userId);

    // escolher novo idioma
    const newLang = id === "lang_set_pt" ? "pt-BR" : "en-US";

    logger.info(`[BTN] ${id} por ${interaction.user.tag} (${userId})`);

    // ⚠️ resposta rápida sempre
    // usando flags (ephemeral)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // checar cooldown
    const gate = canChangeLanguage(userId);

    if (!gate.ok) {
      return interaction.editReply({
        content: t(lang, "LANG_COOLDOWN", { time: formatTimeLeft(gate.leftMs) }),
      });
    }

    // aplicar
    const result = setUserLanguage(userId, newLang);

    if (!result.ok) {
      // fallback de segurança
      return interaction.editReply({
        content: t(lang, "LANG_COOLDOWN", { time: formatTimeLeft(result.leftMs) }),
      });
    }

    // resposta usando o idioma NOVO já
    return interaction.editReply({
      content: t(newLang, "LANG_CHANGED", { lang: newLang }),
    });
  }

  // ========================================================
  // Botões globais ainda não implementados
  // ========================================================
  logger.warn(`Botão sem handler: ${id}`);

  return interaction.reply({
    content: "⚠️ Este botão ainda não foi implementado.",
    flags: MessageFlags.Ephemeral,
  });
};
