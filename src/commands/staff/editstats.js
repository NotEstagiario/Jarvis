/**
 * /editstats
 *
 * =========================================================
 *  🧪 FERRAMENTA DE TESTE (Owner-only)
 * =========================================================
 * Edita estatísticas diretamente no DB para testes.
 *
 * [CRÍTICO][NÃO TOCAR]
 * Isso é uma ferramenta perigosa. Deve ser exclusiva do Owner.
 */

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { prisma } = require("../../prismaClient");
const { assertOwnerOnly } = require("../../services/ownerOnlyService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editstats")
    .setDescription("👑 (Owner) Editar estatísticas de um jogador para testes.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário alvo").setRequired(true))
    .addStringOption((o) =>
      o.setName("campo")
        .setDescription("Campo do perfil")
        .setRequired(true)
        .addChoices(
          { name: "wins", value: "wins" },
          { name: "losses", value: "losses" },
          { name: "draws", value: "draws" },
          { name: "goalsFor", value: "goalsFor" },
          { name: "goalsAgainst", value: "goalsAgainst" },
          { name: "xp", value: "xp" },
          { name: "championships", value: "championships" },
          { name: "badges_json", value: "badges" },
        )
    )
    .addStringOption((o) => o.setName("valor").setDescription("Novo valor").setRequired(true)),

  async execute(interaction) {
    if (!(await assertOwnerOnly(interaction))) return;

    const guildId = interaction.guildId;
    const target = interaction.options.getUser("usuario");
    const field = interaction.options.getString("campo");
    const raw = interaction.options.getString("valor");

    // garantir player
    await prisma.player.upsert({
      where: { guildId_discordId: { guildId, discordId: target.id } },
      update: {},
      create: { guildId, discordId: target.id },
    });

    let value;
    if (field === "badges") {
      try { value = JSON.parse(raw); }
      catch {
        return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ badges_json precisa ser JSON válido." });
      }
    } else {
      const n = Number(raw);
      if (Number.isNaN(n)) return interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Valor precisa ser numérico." });
      value = n;
    }

    await prisma.player.update({
      where: { guildId_discordId: { guildId, discordId: target.id } },
      data: { [field]: value },
    });

    return interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `✅ Stats atualizadas: <@${target.id}> **${field}** = \`${raw}\``,
    });
  }
};
