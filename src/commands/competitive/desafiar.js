// src/commands/competitive/desafiar.js

const { SlashCommandBuilder } = require("discord.js");
const { ensureCanUseCompetitive } = require("../../modules/competitive/matches/match.guard");
const { buildStartEmbed, buildStartButtons, buildExpiredEmbed } = require("../../modules/competitive/matches/match.presenter");

const { setLock, userHasAnyLock, clearLock } = require("../../modules/competitive/matches/match.service");
const { LOCK_TYPES } = require("../../modules/competitive/matches/match.constants");

function now() {
  return Date.now();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("desafiar")
    .setDescription("Iniciar um confronto competitivo"),

  async execute(interaction) {
    const guard = ensureCanUseCompetitive(interaction);
    if (!guard.ok) {
      return interaction.reply(guard.reply);
    }

    const userId = interaction.user.id;

    // trava imediatamente no menu inicial
    const currentLock = userHasAnyLock(userId);
    if (!currentLock) {
      setLock(userId, LOCK_TYPES.PENDING_MENU, null);
    }

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const color = member?.displayColor || 0x2b2d31;

    const expiresAt = now() + 60_000;

    await interaction.reply({
      ephemeral: true,
      embeds: [buildStartEmbed(userId, color, null, expiresAt)],
      components: buildStartButtons(userId),
    });

    // timeout REAL pra fechar menu abandonado
    setTimeout(async () => {
      try {
        const lock = userHasAnyLock(userId);
        const lockType = String(lock?.lockType || "").toLowerCase();

        if (lock && lockType === LOCK_TYPES.PENDING_MENU) {
          clearLock(userId);

          // fecha wizard do menu
          try {
            await interaction.editReply({
              embeds: [buildExpiredEmbed(userId, color)],
              components: [],
            });
          } catch {}
        }
      } catch {}
    }, 60_000);
  },
};
