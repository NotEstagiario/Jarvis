/**
 * src/services/staffLogService.js
 *
 * [CRITICAL][STAFF]
 * Centralizes staff logging. In the future this can support a binded staff log channel.
 */

const { EmbedBuilder } = require("discord.js");
const { EMBED_FOOTER } = require("../config/constants");

async function sendStaffLog({ channel, title, description, color = 0xf59e0b }) {
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: EMBED_FOOTER })
    .setTimestamp(new Date());
  return channel.send({ embeds: [embed] });
}

module.exports = { sendStaffLog };
