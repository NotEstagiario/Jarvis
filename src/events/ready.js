// src/events/ready.js

// ========================================================
// Ready Event - Jarvis
//
// ✅ Regras do Word:
// - Ao ligar o bot: exibir log bonito
// - Painéis fixos:
//    - Idioma: verificar se existe no canal, se não existir -> postar
//    - Gameplay: (será no próximo arquivo/etapa do v1.2)
// - Não spammar
// ========================================================

const logger = require("../core/logger");
const azyron = require("../config/azyronIds");
const { buildLanguagePanel } = require("../modules/global/language/language.panel");

async function ensureLanguagePanel(client) {
  try {
    const channelId = azyron.channels.language;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      logger.warn(`[PANELS] Canal de idioma não encontrado: ${channelId}`);
      return;
    }

    // Buscar mensagens recentes e detectar se já existe painel
    const msgs = await channel.messages.fetch({ limit: 30 }).catch(() => null);
    if (!msgs) return;

    const botId = client.user.id;

    const alreadyExists = msgs.some((m) => {
      if (!m.author || m.author.id !== botId) return false;
      if (!m.components?.length) return false;

      // checar se contém botões esperados
      const hasLangButtons = m.components.some((row) =>
        row.components?.some((c) => c.customId === "lang_set_pt" || c.customId === "lang_set_en")
      );

      return hasLangButtons;
    });

    if (alreadyExists) {
      logger.info("[PANELS] Painel de idioma já existe. Mantendo.");
      return;
    }

    const panel = buildLanguagePanel();
    await channel.send(panel);

    logger.info("[PANELS] ✅ Painel de idioma postado automaticamente.");
  } catch (err) {
    logger.error("[PANELS] Erro ao garantir painel de idioma.", err);
  }
}

module.exports = async (client) => {
  logger.info(`✅ Jarvis ONLINE — ${require("../config/bot").version} 👑 King N`);
  logger.info(`Logado como: ${client.user.tag}`);

  await ensureLanguagePanel(client);
};
