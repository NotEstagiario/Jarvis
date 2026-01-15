/**
 * src/services/resultService.js
 *
 * [CRITICAL][INTEGRITY]
 * Applies official results into Player stats. This is the backbone of /perfil and future /season.
 *
 * For now:
 * - Updates matches, wins/losses/draws, goalsFor/goalsAgainst
 * - Updates streaks
 */

const { prisma } = require("../prismaClient");

async function ensurePlayer(guildId, discordId) {
  return prisma.player.upsert({
    where: { guildId_discordId: { guildId, discordId } },
    update: {},
    create: { guildId, discordId }
  });
}

function calcOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) return "HOME_WIN";
  if (awayScore > homeScore) return "AWAY_WIN";
  return "DRAW";
}

async function applyOfficialMatchResult({ guildId, homeId, awayId, homeScore, awayScore }) {
  await ensurePlayer(guildId, homeId);
  await ensurePlayer(guildId, awayId);

  const outcome = calcOutcome(homeScore, awayScore);

  // home
  const homeUpdate = {
    matches: { increment: 1 },
    goalsFor: { increment: homeScore },
    goalsAgainst: { increment: awayScore },
  };
  const awayUpdate = {
    matches: { increment: 1 },
    goalsFor: { increment: awayScore },
    goalsAgainst: { increment: homeScore },
  };

  if (outcome === "HOME_WIN") {
    homeUpdate.wins = { increment: 1 };
    awayUpdate.losses = { increment: 1 };
  } else if (outcome === "AWAY_WIN") {
    awayUpdate.wins = { increment: 1 };
    homeUpdate.losses = { increment: 1 };
  } else {
    homeUpdate.draws = { increment: 1 };
    awayUpdate.draws = { increment: 1 };
  }

  const [homePlayer, awayPlayer] = await Promise.all([
    prisma.player.findUnique({ where: { guildId_discordId: { guildId, discordId: homeId } } }),
    prisma.player.findUnique({ where: { guildId_discordId: { guildId, discordId: awayId } } }),
  ]);

  // streak logic
  let homeStreak = homePlayer.currentWinStreak;
  let awayStreak = awayPlayer.currentWinStreak;

  if (outcome === "HOME_WIN") {
    homeStreak += 1; awayStreak = 0;
  } else if (outcome === "AWAY_WIN") {
    awayStreak += 1; homeStreak = 0;
  } else {
    homeStreak = 0; awayStreak = 0;
  }

  await Promise.all([
    prisma.player.update({
      where: { guildId_discordId: { guildId, discordId: homeId } },
      data: {
        ...homeUpdate,
        currentWinStreak: homeStreak,
        bestWinStreak: Math.max(homePlayer.bestWinStreak, homeStreak),
      }
    }),
    prisma.player.update({
      where: { guildId_discordId: { guildId, discordId: awayId } },
      data: {
        ...awayUpdate,
        currentWinStreak: awayStreak,
        bestWinStreak: Math.max(awayPlayer.bestWinStreak, awayStreak),
      }
    }),
  ]);
}

module.exports = { applyOfficialMatchResult };


// =========================================================
// WIZARD START - Resultado Normal (integração /registrarresultado)
// =========================================================
async function startNormalResultWizard({ channel, guildId, matchId, authorId, opponentId }) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  const result = await prisma.result.create({
    data: {
      guildId,
      matchId,
      authorId,
      opponentId,
      status: "WIZARD_HOME",
      homeScore: 0,
      awayScore: 0,
      channelId: channel.id,
    },
  });

  const numbersRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:0`).setLabel("0").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:1`).setLabel("1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:2`).setLabel("2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:3`).setLabel("3").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:4`).setLabel("4").setStyle(ButtonStyle.Secondary),
  );

  const numbersRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:5`).setLabel("5").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:6`).setLabel("6").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:7`).setLabel("7").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:8`).setLabel("8").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rw_home:${result.id}:9`).setLabel("9").setStyle(ButtonStyle.Secondary),
  );

  const embed = new EmbedBuilder()
    .setTitle("📌 Placar do Time da CASA")
    .setDescription("Selecione a quantidade de gols do jogador da esquerda (casa).")
    .setColor(0x2b2d31);

  const msg = await channel.send({ embeds: [embed], components: [numbersRow, numbersRow2] });

  // salva para limpeza depois
  await prisma.result.update({
    where: { id: result.id },
    data: { wizardMessageId: msg.id, wizardChannelId: channel.id },
  }).catch(()=>{});

  return { resultId: result.id, messageId: msg.id };
}
