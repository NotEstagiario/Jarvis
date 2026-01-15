/**
 * src/handlers/buttons/resultWizardButtons.js
 *
 * =========================================================
 * ✅ BOTÕES: Wizard do /registrarresultado
 * =========================================================
 * Este handler controla o fluxo do placar:
 * - escolher gols da casa (rw_pick_home:0..9)
 * - escolher gols visitante (rw_pick_away:0..9)
 * - confirmar autor (rw_author_confirm:<resultId>)
 * - cancelar (rw_author_cancel:<resultId>)
 *
 * [OBS]
 * Fluxos avançados (timeout, staff review, OCR, etc) continuam
 * no service e serão migrados em updates seguintes.
 */

const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { finalizeConfirmedResult } = require("../../services/resultFinalizeService");
const { prisma } = require("../../prismaClient");
const { EMBED_FOOTER } = require("../../config/constants");

async function handleResultWizardButtons(client, interaction) {
  const id = interaction.customId;

  // =========================================================
  // 1) Pick score home
  // =========================================================
  if (id.startsWith("rw_pick_home:")) {
    const score = Number(id.split(":")[1]);
    const resultId = interaction.message?.embeds?.[0]?.footer?.text?.match(/RID:(\w+)/)?.[1];

    if (!resultId) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Não consegui identificar o ResultId." });
    }

    await prisma.result.update({ where: { id: resultId }, data: { homeScore: score } });

    const embed = new EmbedBuilder()
      .setTitle("📝 Registrar Resultado — Placar do Visitante")
      .setColor(0x60a5fa)
      .setDescription("Selecione o número de gols do **visitante**.")
      .setFooter({ text: `RID:${resultId} • ${EMBED_FOOTER}` });

    const row1 = new ActionRowBuilder().addComponents(
      ...Array.from({ length: 5 }).map((_, i) =>
        new ButtonBuilder().setCustomId(`rw_pick_away:${i}`).setLabel(String(i)).setStyle(ButtonStyle.Secondary)
      )
    );
    const row2 = new ActionRowBuilder().addComponents(
      ...Array.from({ length: 5 }).map((_, i) =>
        new ButtonBuilder().setCustomId(`rw_pick_away:${i + 5}`).setLabel(String(i + 5)).setStyle(ButtonStyle.Secondary)
      )
    );

    return interaction.update({ embeds: [embed], components: [row1, row2] });
  }

  // =========================================================
  // 2) Pick score away
  // =========================================================
  if (id.startsWith("rw_pick_away:")) {
    const score = Number(id.split(":")[1]);
    const resultId = interaction.message?.embeds?.[0]?.footer?.text?.match(/RID:(\w+)/)?.[1];

    if (!resultId) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Não consegui identificar o ResultId." });
    }

    await prisma.result.update({ where: { id: resultId }, data: { awayScore: score } });

    const embed = new EmbedBuilder()
      .setTitle("✅ Registrar Resultado — Confirmar")
      .setColor(0x22c55e)
      .setDescription("Confira se o placar está correto e confirme.")
      .setFooter({ text: `RID:${resultId} • ${EMBED_FOOTER}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rw_author_confirm:${resultId}`).setLabel("Confirmar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`rw_author_cancel:${resultId}`).setLabel("Cancelar").setStyle(ButtonStyle.Danger),
    );

    return interaction.update({ embeds: [embed], components: [row] });
  }

  // =========================================================
  // 3) Author confirm
  // =========================================================
  // =========================================================
// 3) Opponent confirm/deny
// =========================================================
if (id.startsWith("rw_opp_confirm:")) {
  const resultId = id.split(":")[1];
  await prisma.result.update({ where: { id: resultId }, data: { opponentConfirmedAt: new Date(), status: "CONFIRMED" } }).catch(()=>{});

  const embed = new EmbedBuilder()
    .setTitle("✅ Resultado confirmado!")
    .setColor(0x22c55e)
    .setDescription("O resultado foi confirmado pelo adversário. A staff pode auditar se necessário.")
    .setFooter({ text: `RID:${resultId} • ${EMBED_FOOTER}` });

  return interaction.update({ embeds: [embed], components: [] });
}

if (id.startsWith("rw_opp_deny:")) {
  const resultId = id.split(":")[1];

  const modal = new ModalBuilder()
    .setCustomId(`rw_opp_deny_modal:${resultId}`)
    .setTitle("Justificativa da Recusa");

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Por que você está recusando este resultado?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reason));
  return interaction.showModal(modal);
}

// =========================================================
// 4) Author confirm
// =========================================================
if (id.startsWith("rw_author_confirm:")) {
    const resultId = id.split(":")[1];

    await prisma.result.update({ where: { id: resultId }, data: { authorConfirmedAt: new Date() } });

    const embed = new EmbedBuilder()
  .setTitle("⏳ Aguardando confirmação do adversário")
  .setColor(0xf59e0b)
  .setDescription("O adversário recebeu a solicitação e tem **5 minutos** para confirmar ou recusar.")
  .setFooter({ text: `RID:${resultId} • ${EMBED_FOOTER}` });

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`rw_opp_confirm:${resultId}`).setLabel("Confirmar").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`rw_opp_deny:${resultId}`).setLabel("Recusar").setStyle(ButtonStyle.Danger),
);

return interaction.update({ embeds: [embed], components: [row] });
  }

  // =========================================================
  // 4) Cancel wizard
  // =========================================================
  if (id.startsWith("rw_author_cancel:")) {
    const resultId = id.split(":")[1];
    await prisma.result.delete({ where: { id: resultId } }).catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle("❌ Registro cancelado")
      .setColor(0xef4444)
      .setDescription("O registro de resultado foi cancelado.")
      .setFooter({ text: EMBED_FOOTER });

    return interaction.update({ embeds: [embed], components: [] });
  }

  return interaction.reply({ flags: MessageFlags.Ephemeral, content: "⚠️ Botão do resultado não reconhecido." });
}

module.exports = { handleResultWizardButtons };

// timeout scheduling is called when opponent confirm embed is posted (see above).
