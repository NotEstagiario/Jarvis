/**
 * /resetstats
 *
 * =========================================================
 *  ♻️ RESET DE ESTATÍSTICAS (Alta staff + justificativa)
 * =========================================================
 * Regras:
 * - Permitido: Presidente, Vice-Presidentes e Conselho.
 * - Owner tem bypass total.
 * - Sempre exige JUSTIFICATIVA via modal.
 * - Justificativa é enviada pro canal de logs.
 *
 * Modos:
 * - GLOBAL: reseta todos
 * - USUARIO: reseta apenas 1 usuário
 *
 * [CRÍTICO]
 * Esse comando pode destruir a integridade do competitivo.
 * Nunca remova a justificativa/log.
 */

const {
  SlashCommandBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const { isOwner } = require("../../services/ownerService");
const { isStaff } = require("../../services/permissionService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetstats")
    .setDescription("♻️ Resetar estatísticas (GLOBAL ou por usuário) [Alta staff].")
    .addStringOption((o) =>
      o.setName("modo")
        .setDescription("Tipo de reset")
        .setRequired(true)
        .addChoices(
          { name: "GLOBAL", value: "GLOBAL" },
          { name: "USUARIO", value: "USUARIO" }
        )
    )
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário alvo (quando modo=USUARIO)").setRequired(false)),

  async execute(interaction) {
    const allowed = isOwner(interaction.user.id) || isStaff(interaction.member);
    if (!allowed) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "🚫 Apenas alta staff." });
    }

    const mode = interaction.options.getString("modo");
    const target = interaction.options.getUser("usuario");

    if (mode === "USUARIO" && !target) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Informe um usuário." });
    }

    // Modal obrigatório com justificativa
    const modal = new ModalBuilder()
      .setCustomId(`resetstats_modal:${mode}:${target?.id || "NONE"}`)
      .setTitle("Justificativa do Reset");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Explique por que esse reset está sendo feito")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return interaction.showModal(modal);
  }
};
