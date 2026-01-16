// src/events/ready.js

const logger = require("../core/logger");
const botConfig = require("../config/bot");
const azyron = require("../config/azyronIds");

const { ensureLanguagePanel } = require("../modules/global/language/language.panel");
const { buildGameplayPanel } = require("../modules/global/gameplay/gameplay.panel");

async function hasPanelMessage(channel, clientUserId, uniqueTextA, uniqueTextB) {
  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    return messages.some((m) => {
      if (!m.author || m.author.id !== clientUserId) return false;
      const desc = m.embeds?.[0]?.description || "";
      return desc.includes(uniqueTextA) && desc.includes(uniqueTextB);
    });
  } catch (err) {
    logger.error("Erro buscando mensagens do canal (painéis fixos).", err);
    return false;
  }
}

module.exports = async (client) => {
  try {
    logger.info("✅ Jarvis ONLINE — " + botConfig.version + " 👑 King N");
    logger.info("Logado como: " + client.user.tag);

    // painel idioma (v1.2) — agora sem spam
    try {
      await ensureLanguagePanel(client);
    } catch (err) {
      logger.error("Falha ao garantir painel de idioma.", err);
    }

    // painel gameplay (v1.3)
    const styleChannelId = azyron.channels.style;
    if (!styleChannelId) return;

    const channel = await client.channels.fetch(styleChannelId).catch(() => null);
    if (!channel) return;

    const exists = await hasPanelMessage(
      channel,
      client.user.id,
      "Qual seu estilo de jogo?",
      "What’s your playstyle?"
    );

    if (!exists) {
      logger.warn("Painel Gameplay não encontrado. Postando novamente...");
      await channel.send(buildGameplayPanel());
      logger.info("✅ Painel Gameplay postado com sucesso.");
    } else {
      logger.info("✅ Painel Gameplay já existe. Nenhuma ação necessária.");
    }
  } catch (err) {
    logger.error("Erro no evento ready.", err);
  }
};
