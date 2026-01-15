/**
 * src/services/fixedPanelService.js
 *
 * =========================================================
 *  📌 SISTEMA DE PAINÉIS FIXOS (Auto-Setup)
 * =========================================================
 * [CRÍTICO]
 * - Esse serviço garante que painéis importantes do bot
 *   sempre existam no servidor (mesmo se alguém apagar).
 * - Ele evita spam/duplicação.
 * - Ele é base para expansão do bot (Season, Ranking, etc).
 *
 * Como funciona:
 * 1) Salva no DB um registro de (guildId + key) -> messageId.
 * 2) No boot (ready.js) tenta buscar a mensagem.
 * 3) Se não existir, recria e atualiza o DB.
 */

const { prisma } = require("../prismaClient");

async function ensureFixedPanel({ guild, channelId, key, payload }) {
  const guildId = guild.id;

  // 1) tentar buscar no DB
  const existing = await prisma.fixedMessage.findUnique({
    where: { guildId_key: { guildId, key } }
  });

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return { ok: false, reason: "CHANNEL_NOT_FOUND" };

  // 2) se existe no DB, tentar buscar a mensagem
  if (existing?.messageId) {
    const msg = await channel.messages.fetch(existing.messageId).catch(() => null);
    if (msg) {
      // (opcional) podemos editar se quiser atualizar layout
      await msg.edit(payload).catch(() => {});
      return { ok: true, messageId: msg.id, created: false, edited: true };
    }
  }

  // 3) não existe (ou foi apagada) -> recriar
  const createdMsg = await channel.send(payload);

  await prisma.fixedMessage.upsert({
    where: { guildId_key: { guildId, key } },
    update: { channelId, messageId: createdMsg.id },
    create: { guildId, key, channelId, messageId: createdMsg.id }
  });

  return { ok: true, messageId: createdMsg.id, created: true };
}

module.exports = { ensureFixedPanel };
