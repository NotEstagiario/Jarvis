/**
 * /vertoken
 *
 * Pendência #9
 * - Staff consulta token de uma partida ativa de um jogador.
 * - Mostra status e botão "Copiar Token" quando ACTIVE.
 */

const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { assertStaff } = require("../../utils/permissionUtils");
const { prisma } = require("../../prismaClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vertoken")
    .setDescription("Ver token/matchId de uma partida")
    .addUserOption(opt => opt.setName("jogador").setDescription("Jogador em confronto").setRequired(true)),

  async execute(interaction) {
    const ok = await assertStaff(interaction);
    if (!ok) return;

    const user = interaction.options.getUser("jogador", true);

    const match = await prisma.match.findFirst({
      where: {
        guildId: interaction.guildId,
        OR: [{ authorId: user.id }, { opponentId: user.id }],
        status: { in: ["PENDING", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!match) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Nenhuma partida pendente/ativa encontrada para este jogador." });
    }

    const token = match.token || match.id;
    const active = match.status === "ACTIVE";

    const embed = new EmbedBuilder()
      .setTitle("🔎 Ver Token de Partida")
      .setColor(active ? 0x22c55e : 0xf59e0b)
      .setDescription(
        `**Jogador:** <@${user.id}>\n` +
        `**Status:** ${match.status}\n` +
        `**Token:** \`${token}\``
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_token:${token}`)
        .setLabel("Copiar Token")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!active)
    );

    return interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed], components: [row] });
  },
};
