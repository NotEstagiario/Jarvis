/**
 * src/ui/embeds/perfilEmbeds.js
 *
 * [UX]
 * All Perfil embeds are built here to keep commands clean.
 */

const { EmbedBuilder } = require("discord.js");
const { EMBED_FOOTER } = require("../../config/constants");
const { t } = require("../../i18n");

function buildPerfilEmbed({ lang, member, rank }) {
  const embed = new EmbedBuilder()
    .setTitle(t(lang, "perfil.title"))
    .setColor(rank.color)
    .setFooter({ text: EMBED_FOOTER });

  embed.setDescription(`${member} • ${rank.emoji} ${rank.namePt}`);

  return embed;
}

module.exports = { buildPerfilEmbed };
