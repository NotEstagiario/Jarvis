// src/commands/staff/analisarperfil.js

// ========================================================
// /analisarperfil (STAFF)
//
// ✅ Regra do Word:
// - /perfil = SEMPRE o próprio perfil
// - /analisarperfil = staff escolhe um usuário e analisa
//
// ✅ Extras STAFF (privados):
// - vitórias via WO
// - advertências
// - punishedUntil (se existir)
// - userId do jogador
//
// ✅ EXTRA:
// - maior cargo do jogador no servidor
// - quantidade de cargos no servidor
//
// ⚠️ IMPORTANTE:
// - Discord permite no máximo 5 botões por ActionRow
// - então: tabs divididas em 2 linhas
// ========================================================

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const logger = require("../../core/logger");
const azyron = require("../../config/azyronIds");
const { getUserLang } = require("../../utils/lang");
const { getCompetitiveProfile } = require("../../modules/global/profiles/profile.service");
const { buildProfileUI } = require("../../modules/global/profiles/profile.presenter");

// ========================================================
// DEBUG anti-spam (Word)
// - Em produção NÃO pode poluir terminal com comando
// - Para ativar logs: DEBUG_COMMANDS=true no .env
// ========================================================
const DEBUG_COMMANDS = String(process.env.DEBUG_COMMANDS || "").toLowerCase() === "true";

function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

function hasStaffRole(member) {
  const staffRoleId = azyron.roles.staff;
  if (!staffRoleId) return false;
  return member?.roles?.cache?.has(staffRoleId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("analisarperfil")
    .setDescription("Analisa o perfil competitivo de um jogador (Staff)")
    .addUserOption((opt) =>
      opt
        .setName("jogador")
        .setDescription("Selecione o jogador para analisar")
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = getUserLang(interaction.user.id);

    // ✅ Anti-spam terminal: loga só se DEBUG_COMMANDS=true
    if (DEBUG_COMMANDS) {
      logger.info(`[CMD] /analisarperfil por ${interaction.user.tag} (${interaction.user.id})`);
    }

    // ✅ sempre deferReply
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // ========================================================
    // Permissão (Staff ou Presidente)
    // ========================================================
    if (!isPresident(interaction.user.id) && !hasStaffRole(interaction.member)) {
      return interaction.editReply({
        content:
          lang === "en-US"
            ? "⛔ You do not have permission to use this command."
            : "⛔ Você não tem permissão para usar este comando.",
      });
    }

    const target = interaction.options.getUser("jogador");
    const profile = getCompetitiveProfile(target.id);

    // membro do servidor (pra extrair cargos)
    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);

    // ========================================================
    // UI centralizada
    // ========================================================
    const { pages, tabsRows, navRow } = buildProfileUI({
      lang,
      mode: "STAFF",
      viewerUserId: interaction.user.id,
      targetUser: target,
      targetMember,
      profileData: profile,
      guildId: interaction.guild?.id,
    });

    let page = 0;

    const message = await interaction.editReply({
      embeds: [pages[page]],
      components: [...tabsRows, navRow(page)],
    });

    const collector = message.createMessageComponentCollector({
      time: 1000 * 60 * 5,
    });

    collector.on("collect", async (i) => {
      // só quem executou o comando
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: lang === "en-US" ? "❌ Only you can use these buttons." : "❌ Apenas você pode usar esses botões.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // tabs
      if (i.customId === "profile_page_player") page = 0;
      if (i.customId === "profile_page_badges") page = 1;
      if (i.customId === "profile_page_matches") page = 2;
      if (i.customId === "profile_page_goals") page = 3;
      if (i.customId === "profile_page_rivalries") page = 4;
      if (i.customId === "profile_page_staff") page = 5;

      // nav
      if (i.customId === "profile_back") page = Math.max(0, page - 1);
      if (i.customId === "profile_next") page = Math.min(pages.length - 1, page + 1);

      await i.update({
        embeds: [pages[page]],
        components: [...tabsRows, navRow(page)],
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};
