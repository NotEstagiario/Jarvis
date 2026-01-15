/**
 * src/handlers/modals/cancelModals.js
 *
 * =========================================================
 * ✅ MODAIS: Cancelamento de partida
 * =========================================================
 * - cancel_modal  (autor solicita cancelamento)
 * - cancel_deny_reason:<reqId> (adversário recusa e justifica)
 *
 * [CRÍTICO]
 * Cancelamento é um fluxo sensível e precisa sempre:
 * - gerar evidência (log)
 * - manter justificativas
 */

const {
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { prisma } = require("../../prismaClient");
const { EMBED_FOOTER, STAFF_LOG_CHANNEL_ID } = require("../../config/constants");

async function handleCancelModals(client, interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const id = interaction.customId;

  // =========================================================
  // 1) Autor solicita cancelamento
  // =========================================================
  if (id === "cancel_modal") {
    const reason = interaction.fields.getTextInputValue("reason");

    // match pendente/ativo do usuário
    const match = await prisma.match.findFirst({
      where: {
        guildId,
        status: { in: ["PENDING", "ACTIVE"] },
        OR: [{ authorId: userId }, { opponentId: userId }],
      },
    });

    if (!match) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "❌ Você não tem confronto em andamento.",
      });
    }

    const opponentId = match.authorId === userId ? match.opponentId : match.authorId;

    // cria request
    const req = await prisma.matchCancelRequest.create({
      data: {
        guildId,
        matchId: match.id,
        token: match.token || null,
        authorId: userId,
        opponentId,
        authorReason: reason,
        status: "PENDING",
      },
    });

    // log staff
    const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("🧾 Solicitação de Cancelamento")
        .setColor(0xf59e0b)
        .setDescription(
          `**Autor:** <@${userId}>\n` +
          `**Oponente:** <@${opponentId}>\n` +
          `**Token:** \`${match.token || match.id}\`\n\n` +
          `**Motivo do autor:**\n> ${reason}`
        )
        .setFooter({ text: EMBED_FOOTER });

      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setTitle("❌ Solicitação de Cancelamento")
      .setColor(0xef4444)
      .setDescription(
        `<@${userId}> solicitou o cancelamento da partida.\n\n` +
        `**Motivo:**\n> ${reason}\n\n` +
        `Você aceita?`
      )
      .setFooter({ text: EMBED_FOOTER });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_accept:${req.id}`)
        .setLabel("Confirmar Cancelamento")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cancel_deny:${req.id}`)
        .setLabel("Não Aceito Cancelar")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "✅ Pedido enviado ao adversário.",
    });

    return interaction.channel.send({
      content: `<@${opponentId}>`,
      embeds: [embed],
      components: [row],
    });
  }

  // =========================================================
  // 2) Adversário recusa e justifica
  // =========================================================
  if (id.startsWith("cancel_deny_reason:")) {
    const reqId = id.split(":")[1];
    const denyReason = interaction.fields.getTextInputValue("reason");

    const req = await prisma.matchCancelRequest.findUnique({ where: { id: reqId } });
    if (!req) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Solicitação inválida." });
    }

    await prisma.matchCancelRequest.update({
      where: { id: reqId },
      data: { opponentReason: denyReason, status: "DISPUTED" },
    });

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Disputa de Cancelamento — Staff necessária")
      .setColor(0xf97316)
      .setDescription(
        `**Autor:** <@${req.authorId}>\n` +
        `**Oponente:** <@${req.opponentId}>\n` +
        `**Token:** \`${req.token || req.matchId}\`\n\n` +
        `**Motivo do autor:**\n> ${req.authorReason}\n\n` +
        `**Motivo da recusa:**\n> ${denyReason}`
      )
      .setFooter({ text: EMBED_FOOTER });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_staff_keep:${req.id}`)
        .setLabel("Manter partida")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`cancel_staff_cancel:${req.id}`)
        .setLabel("Cancelar partida")
        .setStyle(ButtonStyle.Danger),
    );

    const logChannel = await interaction.guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel) await logChannel.send({ embeds: [embed], components: [row] }).catch(()=>{});

    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Recusa registrada. Staff foi notificada." });
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "⚠️ Modal de cancelamento não reconhecido." });
}

module.exports = { handleCancelModals };
