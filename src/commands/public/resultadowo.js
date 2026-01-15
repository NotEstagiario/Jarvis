/**
 * /resultadowo
 *
 * Fluxo W.O (Pendência #5)
 * - autor envia print (obrigatório via anexo)
 * - abre modal justificativa
 * - confirma solicitação
 * - inicia cooldown 10min e cria staff review obrigatório
 *
 * OBS: Staff decide o resultado.
 */

const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { assertCompetitive } = require("../../utils/permissionUtils");
const { prisma } = require("../../prismaClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resultadowo")
    .setDescription("Solicitar W.O (vitória por ausência/desistência)")
    .addAttachmentOption(opt => opt.setName("print").setDescription("Print do resultado").setRequired(true)),

  async execute(interaction) {
    const ok = await assertCompetitive(interaction);
    if (!ok) return;

    const att = interaction.options.getAttachment("print");
    if (!att?.url) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Você precisa anexar um print." });
    }

    // match ACTIVE
    const match = await prisma.match.findFirst({
      where: {
        guildId: interaction.guildId,
        status: "ACTIVE",
        OR: [{ authorId: interaction.user.id }, { opponentId: interaction.user.id }],
      },
      orderBy: { acceptedAt: "desc" },
    });

    if (!match) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Você não tem confronto ativo." });
    }

    // cria WO request
    const req = await prisma.woRequest.create({
      data: {
        guildId: interaction.guildId,
        matchId: match.id,
        token: match.token || null,
        authorId: interaction.user.id,
        opponentId: match.authorId === interaction.user.id ? match.opponentId : match.authorId,
        printUrl: att.url,
        status: "AUTHOR_PENDING",
      },
    });

    const modal = new ModalBuilder()
      .setCustomId(`wo_reason:${req.id}`)
      .setTitle("Justificativa do W.O");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Explique o motivo do W.O")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  },
};
