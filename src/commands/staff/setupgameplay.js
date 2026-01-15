const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const { isStaff } = require("../../services/permissionService");
const { GAMEPLAY_CHANNEL_ID, EMBED_FOOTER } = require("../../config/constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setupgameplay")
    .setDescription(`Postar o painel de escolha de gameplay.`),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Apenas staff." });
    }

    const channel = await interaction.guild.channels.fetch(GAMEPLAY_CHANNEL_ID).catch(() => null);
    if (!channel) {
      return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Canal não encontrado." });
    }

    const embed = new EmbedBuilder()
      .setColor(16758784)
      .setDescription(
        "# ⚔️ Qual seu estilo de jogo?

" +
        "Você poderá escolher apenas **1 cargo**, e você terá acesso a uma categoria com bot, chat e voice exclusiva pro seu modo de jogo. <:eai:1453188592099786876>

" +
        "-# Para a realização de troca de cargo, por gentileza solicitar a um administrador."
      )
      .setFooter({ text: EMBED_FOOTER });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("gp_pick_casual")
        .setLabel("Player Casual")
        .setEmoji("<:bensa_laughter:1453194053339316346>")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("gp_pick_competitive")
        .setLabel("Player Competitive")
        .setEmoji("<:bensa_evil:1453193952277827680>")
        .setStyle(ButtonStyle.Primary),
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ flags: MessageFlags.Ephemeral, content: "✅ Painel postado." });
  }
};
