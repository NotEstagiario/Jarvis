// src/modules/staff/resetar/resetar.panel.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const logger = require("../../../core/logger");
const azyron = require("../../../config/azyronIds");

// ✅ Vamos reutilizar o storage do painel (mesmo sistema do idioma)
const { savePanelMessage, getPanelMessage } = require("../../global/language/language.service");
const { PANEL_KEY, BTN } = require("./resetar.constants");

function buildResetPanelPayload() {
  const embed = new EmbedBuilder()
    // ✅ Word: embed vermelha
    .setColor(0xd83c3c)
    .setDescription(
      [
        "# 🧹 Central de Reset",
        "",
        "Painel administrativo para resets do servidor.",
        "",
        "🧹 Reset Estatísticas",
        "🏆 Reset Ranks",
        "📅 Reset Season",
        "🌐 Reset Global",
        "",
        "⚠️ **Regra Word:** Todo reset exige **JUSTIFICATIVA**.",
        "🌐 Resets **Globais** exigem autorização do **Presidente** + **Senha**.",
        "",
        "-# Use somente se você tiver certeza do que está fazendo.",
      ].join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.OPEN_STATS).setEmoji("🧹").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.OPEN_RANKS).setEmoji("🏆").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.OPEN_SEASON).setEmoji("📅").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN.GLOBAL_ALL).setEmoji("🌐").setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

async function ensureResetPanel(client) {
  const channelId = azyron.channels.resetar;
  if (!channelId) return false;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return false;

  const saved = getPanelMessage(PANEL_KEY);

  // 1) se tem messageId salvo, tenta buscar
  if (saved?.messageId) {
    const existing = await channel.messages.fetch(saved.messageId).catch(() => null);
    if (existing) return false;
  }

  // 2) fallback: procurar nas últimas mensagens
  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  if (recent) {
    const found = recent.find((m) => {
      if (m.author?.id !== client.user.id) return false;
      const desc = m.embeds?.[0]?.description || "";
      return desc.includes("Central de Reset") && desc.includes("Painel administrativo");
    });

    if (found) {
      savePanelMessage(PANEL_KEY, channelId, found.id);
      return false;
    }
  }

  // 3) posta e salva ID
  const payload = buildResetPanelPayload();
  const msg = await channel.send(payload);

  savePanelMessage(PANEL_KEY, channelId, msg.id);
  logger.info("[PANELS] ✅ Painel reset postado automaticamente.");
  return true;
}

async function repostResetPanel(client) {
  const channelId = azyron.channels.resetar;
  if (!channelId) return null;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const payload = buildResetPanelPayload();
  const msg = await channel.send(payload);

  savePanelMessage(PANEL_KEY, channelId, msg.id);
  return msg;
}

module.exports = {
  buildResetPanelPayload,
  ensureResetPanel,
  repostResetPanel,
};
