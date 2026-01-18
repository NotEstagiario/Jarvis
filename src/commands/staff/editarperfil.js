// src/commands/staff/editarperfil.js

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const logger = require("../../core/logger");
const { getUserLang } = require("../../utils/lang");
const { t } = require("../../i18n");

const { openEditorMainMenu } = require("../../modules/staff/profileEditor/profileEditor.ui");
const { isAdminWord } = require("../../utils/admin");

// DEBUG anti-spam (Word)
const DEBUG_COMMANDS = String(process.env.DEBUG_COMMANDS || "").toLowerCase() === "true";

function isMasterPasswordOk(input) {
  const expected = String(process.env.MASTER_PASSWORD || "").trim();
  const got = String(input || "").trim();

  // se não configurou no .env => bloqueia
  if (!expected) return false;
  if (!got) return false;

  return expected === got;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editarperfil")
    .setDescription("STAFF: edita estatísticas do perfil competitivo de um jogador")
    .addUserOption((opt) =>
      opt
        .setName("jogador")
        .setDescription("Selecione o jogador (não será mencionado)")
        .setRequired(true)
    )
    // ✅ ALTERADO: master -> senha
    .addStringOption((opt) =>
      opt
        .setName("senha")
        .setDescription("Senha master para acessar o editor (não será salva)")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(64)
    ),

  async execute(interaction) {
    const lang = getUserLang(interaction.user.id);

    if (DEBUG_COMMANDS) {
      logger.info(`[CMD] /editarperfil por ${interaction.user.tag} (${interaction.user.id})`);
    }

    if (!interaction.inGuild()) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: t(lang, "COMP_ONLY_GUILD"),
      });
    }

    // ✅ permissão 1x (Word)
    const allowed = isAdminWord(interaction.member, interaction.user.id);
    if (!allowed) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: t(lang, "EDITOR_ONLY_STAFF"),
      });
    }

    // ✅ senha master
    const masterInput = interaction.options.getString("senha", true);
    if (!isMasterPasswordOk(masterInput)) {
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: lang === "en-US"
          ? "❌ Invalid master password."
          : "❌ Senha master inválida.",
      });
    }

    const target = interaction.options.getUser("jogador", true);

    const msg = await openEditorMainMenu(interaction, {
      staffId: interaction.user.id,
      targetId: target.id,
    });

    if (!msg || typeof msg.createMessageComponentCollector !== "function") {
      if (DEBUG_COMMANDS) {
        logger.warn("[/editarperfil] openEditorMainMenu não retornou Message válida (collector local não criado).");
      }
      return;
    }

    const { BTN: EDIT_BTN, SECTIONS } = require("../../modules/staff/profileEditor/profileEditor.constants");

    const {
      openStatPicker,
      openEditor,
      openModalSetCustom,
      openModalJustify,
      applyDelta,
      applyZero,
    } = require("../../modules/staff/profileEditor/profileEditor.ui");

    const { getState } = require("../../modules/staff/profileEditor/profileEditor.state");

    // flows
    const { handleRivalriesButton, openRivalriesMenu } = require("../../modules/staff/profileEditor/profileEditor.rivalries");
    const { openRankMenu } = require("../../modules/staff/profileEditor/profileEditor.rank");

    // rivalries modal continue fix
    const {
      openNemesisValueModal,
      openFavoriteValueModal,
      openBestWinGoalsForModal,
      openBestWinGoalsAgainstModal,
    } = require("../../modules/staff/profileEditor/profileEditor.rivalries");

    const collector = msg.createMessageComponentCollector({
      time: 1000 * 60 * 10,
    });

    collector.on("collect", async (i) => {
      // ✅ Only who ran the command
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          flags: MessageFlags.Ephemeral,
          content: t(lang, "COMMON_ONLY_YOU"),
        });
      }

      const { customId } = i;

      // segurança: só trata botões do editor
      if (!customId.startsWith("editprofile_")) return;

      try {
        // Rivalries Continue buttons (FIX)
        if (customId === EDIT_BTN.RIVALRIES_CONTINUE_NEMESIS) return openNemesisValueModal(i);
        if (customId === EDIT_BTN.RIVALRIES_CONTINUE_FAVORITE) return openFavoriteValueModal(i);
        if (customId === EDIT_BTN.RIVALRIES_CONTINUE_BESTWIN_FOR) return openBestWinGoalsForModal(i);
        if (customId === EDIT_BTN.RIVALRIES_CONTINUE_BESTWIN_AGAINST) return openBestWinGoalsAgainstModal(i);

        // BACK TO MENU
        if (customId === EDIT_BTN.BACK_MAIN) {
          const st = getState(i.user.id);
          if (!st?.targetId) {
            if (!i.deferred && !i.replied) {
              return i.reply({
                flags: MessageFlags.Ephemeral,
                content: t(lang, "COMMON_ERROR_GENERIC"),
              });
            }
            return;
          }
          return openEditorMainMenu(i, { staffId: i.user.id, targetId: st.targetId });
        }

        // MAIN sections
        if (customId === EDIT_BTN.MAIN_PLAYER) return openStatPicker(i, SECTIONS.PLAYER);
        if (customId === EDIT_BTN.MAIN_BADGES) return openStatPicker(i, SECTIONS.BADGES);
        if (customId === EDIT_BTN.MAIN_MATCHES) return openStatPicker(i, SECTIONS.MATCHES);
        if (customId === EDIT_BTN.MAIN_GOALS) return openStatPicker(i, SECTIONS.GOALS);
        if (customId === EDIT_BTN.MAIN_RIVALRIES) return openStatPicker(i, SECTIONS.RIVALRIES);

        // BACK TO STAT PICKER
        if (customId === EDIT_BTN.BACK_STATS) {
          const st = getState(i.user.id);
          if (!st?.section) {
            if (!i.deferred && !i.replied) {
              return i.reply({
                flags: MessageFlags.Ephemeral,
                content: t(lang, "COMMON_ERROR_GENERIC"),
              });
            }
            return;
          }
          return openStatPicker(i, st.section);
        }

        // Rivalries buttons
        if (
          customId === EDIT_BTN.RIVALRIES_SET_NEMESIS ||
          customId === EDIT_BTN.RIVALRIES_SET_FAVORITE ||
          customId === EDIT_BTN.RIVALRIES_SET_BESTWIN
        ) {
          return handleRivalriesButton(i);
        }

        // Pick stat
        if (customId.startsWith(EDIT_BTN.PICK_PREFIX)) {
          const statKey = customId.slice(EDIT_BTN.PICK_PREFIX.length);

          // flow rank
          if (statKey === "seasonRank_selector" || statKey === "seasonRank") {
            return openRankMenu(i);
          }

          // flow rivalries
          if (statKey === "rivalries_flow") {
            return openRivalriesMenu(i);
          }

          // badgesJson é flow no openEditor
          return openEditor(i, statKey);
        }

        // Edit actions
        if (customId === EDIT_BTN.ACT_PLUS_100) return applyDelta(i, 100);
        if (customId === EDIT_BTN.ACT_PLUS_10) return applyDelta(i, 10);
        if (customId === EDIT_BTN.ACT_PLUS_5) return applyDelta(i, 5);

        if (customId === EDIT_BTN.ACT_ZERO) return applyZero(i);

        if (customId === EDIT_BTN.ACT_MINUS_100) return applyDelta(i, -100);
        if (customId === EDIT_BTN.ACT_MINUS_10) return applyDelta(i, -10);
        if (customId === EDIT_BTN.ACT_MINUS_5) return applyDelta(i, -5);

        if (customId === EDIT_BTN.ACT_SET_CUSTOM) return openModalSetCustom(i);
        if (customId === EDIT_BTN.CONFIRM) return openModalJustify(i);

        // ✅ Anti 40060
        if (i.deferred || i.replied) return;

        return i.reply({
          flags: MessageFlags.Ephemeral,
          content: lang === "en-US" ? "⚠️ Button not recognized." : "⚠️ Botão não reconhecido.",
        });
      } catch (err) {
        logger.error("Erro no collector do /editarperfil", err);
        try {
          // ✅ Anti 40060
          if (i.deferred || i.replied) return;
          return i.reply({
            flags: MessageFlags.Ephemeral,
            content: t(lang, "COMMON_ERROR_GENERIC"),
          });
        } catch {}
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};
