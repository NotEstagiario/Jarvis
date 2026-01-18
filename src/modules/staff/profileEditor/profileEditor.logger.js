// src/modules/staff/profileEditor/profileEditor.logger.js

const { EmbedBuilder } = require("discord.js");

const azyron = require("../../../config/azyronIds");
const { getUserLang } = require("../../../utils/lang");

async function logStaffProfileEdit(interaction, { staffId, targetId, field, value, reason }) {
  try {
    const lang = getUserLang(staffId);

    const logChannelId = azyron.channels.logs;
    const ch = await interaction.client.channels.fetch(logChannelId).catch(() => null);

    if (!ch) return;

    const logEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(lang === "en-US" ? "Profile edit (STAFF)" : "Edição de Perfil (STAFF)")
      .setDescription(
        [
          `👤 Staff: <@${staffId}> (\`${staffId}\`)`,
          `🎯 Alvo: <@${targetId}> (\`${targetId}\`)`,
          `📌 Campo: \`${field}\``,
          `🧾 Novo valor: **${value}**`,
          reason ? `📝 Justificativa: ${reason}` : null,
        ].filter(Boolean).join("\n")
      )
      .setTimestamp();

    await ch.send({ embeds: [logEmbed] });
  } catch {
    // silent fail
  }
}

module.exports = { logStaffProfileEdit };
