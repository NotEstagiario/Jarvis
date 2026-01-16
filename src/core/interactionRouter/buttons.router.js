// src/core/interactionRouter/buttons.router.js

// ========================================================
// Buttons Router - Jarvis
//
// ⚠️ CRÍTICO:
// Este router recebe TODOS botões clicados no servidor.
//
// Regras importantes:
// ✅ Botões de comandos que usam Collector devem ser IGNORADOS aqui
//    (ex.: /perfil) -> o próprio comando trata no collector.
// ❌ Se o router responder primeiro, o collector quebra (Unknown interaction)
// ========================================================

const logger = require("../logger");

module.exports = async (interaction) => {
  const id = interaction.customId;

  // ========================================================
  // ✅ BOTÕES LOCAIS (Collectors) — IGNORAR
  // ========================================================
  // /perfil usa collector com customId prefix "profile_"
  if (id.startsWith("profile_")) {
    return; // deixa o collector do comando tratar
  }

  // (FUTURO) outros collectors:
  // if (id.startsWith("challenge_")) return;
  // if (id.startsWith("result_")) return;

  // ========================================================
  // Botões globais do sistema (aqui entraremos no competitivo)
  // ========================================================

  logger.warn(`Botão sem handler: ${id}`);

  // resposta padrão temporária (mas só para botões que não são collectors)
  return interaction.reply({
    content: "⚠️ Este botão ainda não foi implementado.",
    ephemeral: true,
  });
};
