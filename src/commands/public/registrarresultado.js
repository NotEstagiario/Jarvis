/**
 * /registrarresultado
 *
 * Menu inicial para registrar resultado competitivo.
 *
 * Regras:
 * - Sempre mostra 2 botões:
 *   1) W.O (sempre ativo)
 *   2) Resultado Normal (desativado até 10 minutos após acceptedAt)
 *
 * Obs:
 * - O fluxo completo do wizard de placar já existe no bot via handlers/service.
 * - Este comando é o "menu" centralizador (como você idealizou).
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require("discord.js");
const { assertCompetitive } = require("../../utils/permissionUtils");
const { prisma } = require("../../prismaClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registrarresultado")
    .setDescription("Registrar resultado da sua partida competitiva"),

  async execute(interaction) {
    // 1) Permissão: competitivo only (com mensagens provocativas).
    const ok = await assertCompetitive(interaction);
    if (!ok) return;

    // 2) Precisa ter match ACTIVE
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const match = await prisma.match.findFirst({
      where: {
        guildId,
        status: "ACTIVE",
        OR: [{ authorId: userId }, { opponentId: userId }],
      },
      orderBy: { acceptedAt: "desc" },
    });

    if (!match) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "❌ Você não tem confronto ativo no momento.",
      });
    }

    const now = Date.now();
    const acceptedAt = match.acceptedAt ? new Date(match.acceptedAt).getTime() : 0;
    const diffMs = now - acceptedAt;
    const canNormal = acceptedAt && diffMs >= 10 * 60 * 1000;

    const remainingMs = Math.max(0, 10 * 60 * 1000 - diffMs);
    const remainingMin = Math.ceil(remainingMs / 60000);

    const embed = new EmbedBuilder()
      .setTitle("📌 Registrar Resultado")
      .setDescription(
        [
          `Partida: **${match.token || match.id}**`,
          "",
          "Escolha como deseja registrar:",
          "",
          canNormal
            ? "✅ **Resultado Normal** liberado."
            : `⏳ **Resultado Normal** disponível em **${remainingMin} min**.`,
          "",
          "⚠️ W.O é sempre permitido.",
        ].join("\n")
      )
      .setColor(0x2b2d31);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`regres_wo:${match.id}`)
        .setLabel("W.O")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`regres_normal:${match.id}`)
        .setLabel("Resultado Normal")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!canNormal),
    );

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [embed],
      components: [row],
    });
  },
};
