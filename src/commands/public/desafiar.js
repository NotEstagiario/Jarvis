/**
 * /desafiar
 *
 * Menu único para evitar comandos duplicados:
 * - Já tenho adversário
 * - Procurar adversário
 *
 * Pendência #8: integrar matchmaking no menu.
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require("discord.js");
const { assertCompetitive } = require("../../utils/permissionUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("desafiar")
    .setDescription("Abrir menu de desafio competitivo"),

  async execute(interaction) {
    const ok = await assertCompetitive(interaction);
    if (!ok) return;

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Desafiar")
      .setDescription("Escolha como deseja iniciar um confronto:")
      .setColor(0x2b2d31);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("desafiar_have").setLabel("Já tenho adversário").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("desafiar_find").setLabel("Procurar adversário").setStyle(ButtonStyle.Success),
    );

    return interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed], components: [row] });
  },
};
