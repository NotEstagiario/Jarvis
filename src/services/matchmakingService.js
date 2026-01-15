/**
 * src/services/matchmakingService.js
 *
 * =========================================================
 * ✅ Matchmaking final (OBS 1)
 * =========================================================
 *
 * Convite público:
 * - expira em 10 minutos
 * - botões: Aceitar / Cancelar
 * - ao aceitar: cria Match ACTIVE (usa matchService)
 *
 * Obs:
 * O filtro/rank validation será expandido depois (trash talk pack).
 */

const { prisma } = require("../prismaClient");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createMatchFromMatchmaking } = require("./matchService");

const INVITE_TTL_MS = 10 * 60 * 1000;

function buildInviteEmbed({ authorId, filter }) {
  return new EmbedBuilder()
    .setTitle("🔎 Procurar Adversário")
    .setColor(0x2b2d31)
    .setDescription(
      `**Jogador:** <@${authorId}>\n` +
      `**Filtro:** 🎯 ${filter}\n\n` +
      `Clique em **Aceitar** para entrar no confronto.`
    );
}

function buildInviteComponents(inviteId, authorId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mm_accept:${inviteId}`).setLabel("✅ Aceitar confronto").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`mm_cancel:${inviteId}:${authorId}`).setLabel("❌ Cancelar procura").setStyle(ButtonStyle.Danger),
    ),
  ];
}

async function createMatchmakingInvite({ interaction, filter = "ANY" }) {
  const invite = await prisma.matchmakingInvite.create({
    data: {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      authorId: interaction.user.id,
      filter,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const embed = buildInviteEmbed({ authorId: interaction.user.id, filter });
  const msg = await interaction.channel.send({
    embeds: [embed],
    components: buildInviteComponents(invite.id, interaction.user.id),
  });

  await prisma.matchmakingInvite.update({ where: { id: invite.id }, data: { messageId: msg.id } });

  return invite;
}

async function cancelInvite({ inviteId, userId }) {
  const inv = await prisma.matchmakingInvite.findUnique({ where: { id: inviteId } });
  if (!inv) return { ok: false, reason: "NOT_FOUND" };
  if (inv.authorId !== userId) return { ok: false, reason: "NOT_OWNER" };
  if (inv.status !== "ACTIVE") return { ok: false, reason: "NOT_ACTIVE" };
  await prisma.matchmakingInvite.update({ where: { id: inviteId }, data: { status: "CANCELED" } });
  return { ok: true, inv };
}

async function expireInvite({ inviteId }) {
  const inv = await prisma.matchmakingInvite.findUnique({ where: { id: inviteId } });
  if (!inv || inv.status !== "ACTIVE") return { ok:false };
  if (inv.expiresAt > new Date()) return { ok:false };
  await prisma.matchmakingInvite.update({ where: { id: inviteId }, data: { status: "EXPIRED" } });
  return { ok:true, inv };
}

async function acceptInvite({ inviteId, accepterId }) {
  const inv = await prisma.matchmakingInvite.findUnique({ where: { id: inviteId } });
  if (!inv) return { ok: false, reason: "NOT_FOUND" };
  if (inv.status != "ACTIVE") return { ok: false, reason: "NOT_ACTIVE" };
  if (inv.authorId == accepterId) return { ok: false, reason: "SELF" };
  if (inv.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };

  await prisma.matchmakingInvite.update({
    where: { id: inviteId },
    data: { status: "ACCEPTED", acceptedById: accepterId, acceptedAt: new Date() },
  });

  const match = await createMatchFromMatchmaking({
    guildId: inv.guildId,
    channelId: inv.channelId,
    authorId: inv.authorId,
    opponentId: accepterId,
  });

  return { ok: true, inv, match };
}

module.exports = {
  INVITE_TTL_MS,
  createMatchmakingInvite,
  cancelInvite,
  expireInvite,
  acceptInvite,
};
