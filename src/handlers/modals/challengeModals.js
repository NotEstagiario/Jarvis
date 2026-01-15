/**
 * src/handlers/modals/challengeModals.js
 *
 * =========================================================
 * ✅ MODAL: /desafiar (Já tenho adversário)
 * =========================================================
 */

const {
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { createPendingMatch } = require("../../services/matchService");
const { getRankByMemberRoles } = require("../../domain/ranks");
const { EMBED_FOOTER } = require("../../config/constants");

async function handleChallengeModals(client, interaction) {
  const opponentIdRaw = interaction.fields.getTextInputValue("opponent").trim();
  const guildId = interaction.guildId;
  const authorId = interaction.user.id;

  const opponentId = opponentIdRaw.replace(/[<@!>]/g, "");

  if (!/^\d{10,25}$/.test(opponentId)) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Adversário inválido. Marque um usuário ou cole o ID." });
  }

  if (opponentId === authorId) {
    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Você não pode se desafiar." });
  }

  const match = await createPendingMatch({ guildId, authorId, opponentId });

  const rank = getRankByMemberRoles(interaction.member);

  const invite = new EmbedBuilder()
    .setTitle("⚔️ Pedido de Confronto")
    .setColor(rank?.color || 0x111111)
    .setDescription(`Jogador: <@${authorId}>\nAdversário: <@${opponentId}>`)
    .addFields({ name: "Token", value: `\`${match.token || match.id}\`` })
    .setFooter({ text: EMBED_FOOTER });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`challenge_accept:${match.id}`).setLabel("Confirmar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`challenge_decline:${match.id}`).setLabel("Recusar").setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Convite enviado!" });

  return interaction.channel.send({ embeds: [invite], components: [row] });
}

module.exports = { handleChallengeModals };
