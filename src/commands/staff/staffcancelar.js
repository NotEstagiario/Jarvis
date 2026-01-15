/**
 * /staffcancelar
 *
 * Pendência #9
 * - Staff cancela uma partida usando token
 * - Modal de justificativa obrigatório
 */

const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { assertStaff } = require("../../utils/permissionUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staffcancelar")
    .setDescription("Cancelar partida via token (STAFF)")
    .addStringOption(opt => opt.setName("token").setDescription("Token/MatchID da partida").setRequired(true)),

  async execute(interaction) {
    const ok = await assertStaff(interaction);
    if (!ok) return;

    const token = interaction.options.getString("token", true);

    const modal = new ModalBuilder()
      .setCustomId(`staff_cancel_match:${token}`)
      .setTitle("Cancelar Partida (STAFF)");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Justificativa do cancelamento")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  },
};
