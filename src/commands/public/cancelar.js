/**
 * /cancelar
 *
 * =========================================================
 *  ❌ CANCELAR PARTIDA (Fluxo completo)
 * =========================================================
 * Fluxo:
 * 1) Autor abre modal e escreve motivo
 * 2) Bot cria MatchCancelRequest
 * 3) Bot notifica adversário com botões confirmar/recusar
 * 4) Se recusar -> modal justificativa e vira STAFF_REVIEW
 *
 * [CRÍTICO]
 * Cancelamento não altera stats (apenas encerra match).
 */

const {
  SlashCommandBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const { assertCompetitive } = require("../../services/competitiveGateService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancelar")
    .setDescription("Solicitar cancelamento do confronto atual."),

  async execute(interaction) {
    const gate = await assertCompetitive(interaction);
    if (!gate.ok) return;

    const modal = new ModalBuilder()
      .setCustomId("cancel_modal")
      .setTitle("Cancelar Partida");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Motivo do cancelamento")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return interaction.showModal(modal);
  }
};
