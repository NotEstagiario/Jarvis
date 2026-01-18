// src/core/interactionRouter/buttons.router.js

// ========================================================
// Buttons Router (GLOBAL)
//
// Aqui ficam TODOS os handlers de botões do bot.
// REGRA DO PROJETO:
// - Arquivo organizado e seguro
// - Logs claros (pra debug)
// - Nunca deixar "silencioso"
// - Nunca travar a interaction (sempre responder)
//
// Inclui:
// ✅ Language Panel Buttons (v1.2)
// ✅ Gameplay Style Panel Buttons (v1.3)
//
// ⚠️ IMPORTANTE:
// - Botões do /perfil (profile_*) são tratados DENTRO do comando via collector
// - Botões do /editarperfil (editprofile_*) são tratados DENTRO do comando via collector
//   EXCETO: botões auxiliares do flow de Rivalries Continue (ephemeral)
// ========================================================

const logger = require("../logger");
const azyron = require("../../config/azyronIds");

const { t } = require("../../i18n");
const { getUserLang, setUserLang } = require("../../utils/lang");

const { getDb } = require("../../database/sqlite"); // ✅ necessário pro fix championships

const {
  setGameplayStyleOnce,
  setGameplayStyleForce,
  clearGameplayStyle,
  getGameplayStyle,
  STYLES: GAMEPLAY_STYLES,
} = require("../../modules/global/gameplay/gameplay.service");

// ========================================================
// ✅ Premium Reset service (require no topo -> sem erro no click)
// ========================================================
let premiumResetService = null;
try {
  premiumResetService = require("../../modules/global/premium/premiumReset.service");
} catch (err) {
  logger.error("Premium Reset service não foi carregado. Verifique path:", err);
  premiumResetService = null;
}

// ========================================================
// DEBUG anti-spam (Word)
// ========================================================
const DEBUG_BUTTONS = String(process.env.DEBUG_BUTTONS || "").toLowerCase() === "true";

// ========================================================
// Util — Resposta segura (pra nunca crashar)
// ========================================================
async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
    return interaction.reply(payload);
  } catch {
    logger.warn("Falha em safeReply (ignorado).");
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ========================================================
// Emojis oficiais (Word)
// ========================================================
const EMOJI_COMPETITIVE = "<:bensa_evil:1453193952277827680>";
const EMOJI_CASUAL = "<:bensa_laughter:1453194053339316346>";

const EMOJI_PREMIUM = "<:az_premium:1462033257557266497>";
const EMOJI_MEGA = "<:az_mega:1462033319624572958>";

const COLOR_PREMIUM = 0xe2b719;
const COLOR_MEGA = 0xff5dd6;

// ========================================================
// Mensagens (rotação) — escolher estilo (15 cada)
// ========================================================
const chooseMsgsPT = {
  [GAMEPLAY_STYLES.COMPETITIVE]: [
    `${EMOJI_COMPETITIVE} Então temos alguém que veio para se tornar um leão ao invés de um gatinho?`,
    `${EMOJI_COMPETITIVE} Beleza… agora é sangue nos olhos. Bem-vindo ao **Competitivo**.`,
    `${EMOJI_COMPETITIVE} Você escolheu o **Competitivo**. Aqui não tem espaço pra chororô.`,
    `${EMOJI_COMPETITIVE} Modo **Competitivo** ativado. Hora de virar lenda.`,
    `${EMOJI_COMPETITIVE} Ok. Agora a brincadeira acabou — **Competitivo**.`,
    `${EMOJI_COMPETITIVE} Competitivo selecionado. Mostra do que tu é capaz.`,
    `${EMOJI_COMPETITIVE} Bem-vindo ao **Competitivo**. Só os fortes sobrevivem.`,
    `${EMOJI_COMPETITIVE} Você entrou no **Competitivo**. Sem desculpas, sem perdão.`,
    `${EMOJI_COMPETITIVE} Fechado. **Competitivo** pra quem quer respeito.`,
    `${EMOJI_COMPETITIVE} Competitivo selecionado. Bora farmar vitória de verdade.`,
    `${EMOJI_COMPETITIVE} Agora sim: **Competitivo**. O resto é história.`,
    `${EMOJI_COMPETITIVE} Entrou no **Competitivo**… cuidado pra não virar estatística.`,
    `${EMOJI_COMPETITIVE} Escolheu **Competitivo**. Azyron vai te testar.`,
    `${EMOJI_COMPETITIVE} Competitivo: onde rivalidade vira arte.`,
    `${EMOJI_COMPETITIVE} Você escolheu **Competitivo**. Próxima parada: topo.`,
  ],
  [GAMEPLAY_STYLES.CASUAL]: [
    `${EMOJI_CASUAL} Alguém chegou em Azyron para farmar, hein!?`,
    `${EMOJI_CASUAL} Casual selecionado. Aqui é paz… (mais ou menos).`,
    `${EMOJI_CASUAL} Você escolheu **Casual**. Bem-vindo ao rolê.`,
    `${EMOJI_CASUAL} Modo **Casual** ativado. Bora curtir sem stress.`,
    `${EMOJI_CASUAL} Ok! **Casual** selecionado. Joga bonito e se diverte.`,
    `${EMOJI_CASUAL} Casual: onde a zoeira é liberada.`,
    `${EMOJI_CASUAL} Você foi de **Casual**. Good vibes only.`,
    `${EMOJI_CASUAL} Fechado. **Casual** pra quem quer jogar leve.`,
    `${EMOJI_CASUAL} Casual selecionado. Só não some no meio da partida 😂`,
    `${EMOJI_CASUAL} Entrou no **Casual**. Aqui a resenha manda.`,
    `${EMOJI_CASUAL} Modo Casual: menos pressão, mais diversão.`,
    `${EMOJI_CASUAL} Você escolheu Casual. Azyron agradece seu bom humor.`,
    `${EMOJI_CASUAL} Casual selecionado. Bora jogar e dar risada.`,
    `${EMOJI_CASUAL} Bem-vindo ao Casual. Aqui a derrota dói menos 😄`,
    `${EMOJI_CASUAL} Escolheu Casual. O objetivo é simples: se divertir.`,
  ],
};

const chooseMsgsEN = {
  [GAMEPLAY_STYLES.COMPETITIVE]: [
    `${EMOJI_COMPETITIVE} So… you came to be a lion instead of a kitten?`,
    `${EMOJI_COMPETITIVE} Alright. **Competitive** mode — no excuses.`,
    `${EMOJI_COMPETITIVE} You chose **Competitive**. Time to prove it.`,
    `${EMOJI_COMPETITIVE} **Competitive** activated. Welcome to the grind.`,
    `${EMOJI_COMPETITIVE} No more jokes — **Competitive**.`,
    `${EMOJI_COMPETITIVE} **Competitive** selected. Let’s see your skill.`,
    `${EMOJI_COMPETITIVE} Welcome to **Competitive**. Only the strong survive.`,
    `${EMOJI_COMPETITIVE} **Competitive** it is. No mercy.`,
    `${EMOJI_COMPETITIVE} Locked in: **Competitive**. Earn respect.`,
    `${EMOJI_COMPETITIVE} Competitive selected. Time for real wins.`,
    `${EMOJI_COMPETITIVE} Now we’re talking: **Competitive**.`,
    `${EMOJI_COMPETITIVE} You joined Competitive… don’t become a statistic.`,
    `${EMOJI_COMPETITIVE} You picked **Competitive**. Azyron will test you.`,
    `${EMOJI_COMPETITIVE} Competitive: where rivalries become art.`,
    `${EMOJI_COMPETITIVE} **Competitive** chosen. Next stop: the top.`,
  ],
  [GAMEPLAY_STYLES.CASUAL]: [
    `${EMOJI_CASUAL} Someone came to Azyron to farm, huh!?`,
    `${EMOJI_CASUAL} **Casual** selected. Chill vibes… kinda.`,
    `${EMOJI_CASUAL} You chose **Casual**. Welcome to the vibe.`,
    `${EMOJI_CASUAL} **Casual** mode ON. No stress.`,
    `${EMOJI_CASUAL} Nice! **Casual** selected. Play and enjoy.`,
    `${EMOJI_CASUAL} Casual: where the fun is allowed.`,
    `${EMOJI_CASUAL} You went **Casual**. Good vibes only.`,
    `${EMOJI_CASUAL} Locked in: **Casual**. Just enjoy the game.`,
    `${EMOJI_CASUAL} Casual selected. Just don’t vanish mid-match 😂`,
    `${EMOJI_CASUAL} Welcome to **Casual**. Let the jokes begin.`,
    `${EMOJI_CASUAL} Casual mode: less pressure, more fun.`,
    `${EMOJI_CASUAL} You chose Casual. Azyron appreciates the mood.`,
    `${EMOJI_CASUAL} Casual selected. Let’s play and laugh.`,
    `${EMOJI_CASUAL} Welcome to Casual. Losing hurts less 😄`,
    `${EMOJI_CASUAL} Casual chosen. Simple goal: have fun.`,
  ],
};

// ========================================================
// Mensagens (rotação) — tentativa de trocar (10 cada)
// ========================================================
const lockedMsgsPT = {
  [GAMEPLAY_STYLES.COMPETITIVE]: [
    `${EMOJI_COMPETITIVE} Você já escolheu o **Competitivo**.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Tá querendo fugir do **Competitivo** agora? 😈\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} O leão quer virar gatinho? Não rola.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Trocar estilo não é self-service.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Competitivo é compromisso. Aguenta.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Você escolheu Competitivo e agora quer correr? Hmm…\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Sem switch automático. Aqui é Azyron.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Não tem botão de arrependimento.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Mudança de cargo só com admin.\n➡️ Solicite um administrador.`,
    `${EMOJI_COMPETITIVE} Você já tem escolha registrada.\n➡️ Solicite um administrador.`,
  ],
  [GAMEPLAY_STYLES.CASUAL]: [
    `${EMOJI_CASUAL} Você já escolheu o **Casual**.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Tá querendo virar tryhard do nada? 😂\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Ei… Casual não é ioiô.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Mudança de cargo? Só com admin.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Você já tá no Casual. Relaxa.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Quer trocar por impulso? Não rola.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Isso aqui não é provador de roupa.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Já escolheu o Casual. Segura a resenha.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Trocar estilo não é permitido sozinho.\n➡️ Solicite um administrador.`,
    `${EMOJI_CASUAL} Você já fez sua escolha.\n➡️ Solicite um administrador.`,
  ],
};

const lockedMsgsEN = {
  [GAMEPLAY_STYLES.COMPETITIVE]: [
    `${EMOJI_COMPETITIVE} You already chose **Competitive**.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} Trying to escape Competitive now? 😈\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} The lion wants to be a kitten? Nope.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} Switching roles isn’t self-service.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} Competitive is commitment. Hold it.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} You chose Competitive and now you wanna run?\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} No auto-switching here. This is Azyron.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} No regret button.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} Role changes are admin-only.\n➡️ Ask an administrator.`,
    `${EMOJI_COMPETITIVE} Your choice is already registered.\n➡️ Ask an administrator.`,
  ],
  [GAMEPLAY_STYLES.CASUAL]: [
    `${EMOJI_CASUAL} You already chose **Casual**.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} Suddenly trying to be a tryhard? 😂\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} Hey… Casual isn’t a yo-yo.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} Role changes? Admin-only.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} You’re already Casual. Relax.`,
    `${EMOJI_CASUAL} Switching on impulse? Not allowed.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} This isn’t a fitting room.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} Casual already selected. Keep the vibe.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} Switching styles isn’t allowed by yourself.\n➡️ Ask an administrator.`,
    `${EMOJI_CASUAL} You already made your choice.\n➡️ Ask an administrator.`,
  ],
};

// ========================================================
// Bypass total do presidente (Word)
// ========================================================
function isPresident(userId) {
  return userId === azyron.presidentUserId;
}

// ========================================================
// Helper - escolher "skin" premium (premium vs mega)
// ========================================================
function getPremiumSkin(member) {
  const hasMega = member?.roles?.cache?.has(azyron.roles.megaBooster);
  if (hasMega) {
    return { type: "MEGA", color: COLOR_MEGA, emoji: EMOJI_MEGA };
  }
  return { type: "PREMIUM", color: COLOR_PREMIUM, emoji: EMOJI_PREMIUM };
}

// ========================================================
// Handler principal
// ========================================================
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId } = interaction;
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  // ✅ /perfil buttons (LOCAL collector)
  if (customId.startsWith("profile_")) return;

  // ========================================================
  // ✅ /editarperfil buttons:
  // - por padrão são do collector local (ignorar aqui)
  // - EXCEÇÃO: Rivalries "Continue" buttons (ephemeral flow)
  // ========================================================
  if (customId.startsWith("editprofile_")) {
    const { BTN } = require("../../modules/staff/profileEditor/profileEditor.constants");

    const isRivalryContinue =
      customId === BTN.RIVALRIES_CONTINUE_NEMESIS ||
      customId === BTN.RIVALRIES_CONTINUE_FAVORITE ||
      customId === BTN.RIVALRIES_CONTINUE_BESTWIN_FOR ||
      customId === BTN.RIVALRIES_CONTINUE_BESTWIN_AGAINST;

    if (!isRivalryContinue) return;

    try {
      const {
        openNemesisValueModal,
        openFavoriteValueModal,
        openBestWinGoalsForModal,
        openBestWinGoalsAgainstModal,
      } = require("../../modules/staff/profileEditor/profileEditor.rivalries");

      if (customId === BTN.RIVALRIES_CONTINUE_NEMESIS) return openNemesisValueModal(interaction);
      if (customId === BTN.RIVALRIES_CONTINUE_FAVORITE) return openFavoriteValueModal(interaction);
      if (customId === BTN.RIVALRIES_CONTINUE_BESTWIN_FOR) return openBestWinGoalsForModal(interaction);
      if (customId === BTN.RIVALRIES_CONTINUE_BESTWIN_AGAINST) return openBestWinGoalsAgainstModal(interaction);
    } catch (err) {
      logger.error("Erro nos Rivalries Continue buttons", err);
      return safeReply(interaction, {
        ephemeral: true,
        content: t(lang, "COMMON_ERROR_GENERIC"),
      });
    }
  }

  // ✅ Anti-spam terminal
  if (DEBUG_BUTTONS) {
    logger.info(`[BTN] ${customId} por ${interaction.user.tag} (${userId})`);
  }

  // ========================================================
  // /desafiar (v2.0)
  // ========================================================
  if (
    customId === "challenge_have_opponent" ||
    customId === "challenge_search_opponent" ||
    customId === "challenge_confirm" ||
    customId === "challenge_abort" ||
    customId.startsWith("challenge_accept_") ||
    customId.startsWith("challenge_decline_")
  ) {
    try {
      const {
        handleChallengeHaveOpponent,
        handleChallengeSearchOpponent,
        handleChallengeConfirm,
        handleChallengeAbort,
        handleChallengeAccept,
        handleChallengeDecline,
      } = require("../../modules/competitive/matches/match.ui");

      if (customId === "challenge_have_opponent") return handleChallengeHaveOpponent(interaction);
      if (customId === "challenge_search_opponent") return handleChallengeSearchOpponent(interaction);
      if (customId === "challenge_confirm") return handleChallengeConfirm(interaction);
      if (customId === "challenge_abort") return handleChallengeAbort(interaction);

      if (customId.startsWith("challenge_accept_")) {
        const inviteId = Number(customId.split("_").pop());
        return handleChallengeAccept(interaction, inviteId);
      }

      if (customId.startsWith("challenge_decline_")) {
        const inviteId = Number(customId.split("_").pop());
        return handleChallengeDecline(interaction, inviteId);
      }
    } catch (err) {
      logger.error("Erro nos botões /desafiar", err);
      return safeReply(interaction, {
        ephemeral: true,
        content: t(lang, "COMMON_ERROR_GENERIC"),
      });
    }
  }

  // ========================================================
  // PREMIUM RESET (v2.1 FINAL)
  // ========================================================
  if (
    customId === "resetpremium_premium" ||
    customId === "resetpremium_confirm_yes" ||
    customId === "resetpremium_confirm_no"
  ) {
    try {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

      if (!premiumResetService) {
        return safeReply(interaction, {
          ephemeral: true,
          content: t(lang, "COMMON_ERROR_GENERIC"),
        });
      }

      const { canUsePremiumReset, markPremiumResetUsed, COOLDOWN_MS } = premiumResetService;
      const { resetCompetitivePublicStats } = require("../../modules/global/profiles/profile.service");

      const member = interaction.member;

      const hasPremium = member?.roles?.cache?.has(azyron.roles.premium);
      const hasMega = member?.roles?.cache?.has(azyron.roles.megaBooster);
      const hasAny = hasPremium || hasMega;

      // "Não" -> embed finalizada sem reset
      if (customId === "resetpremium_confirm_no") {
        const skin = getPremiumSkin(member);

        const cancelEmbed = new EmbedBuilder()
          .setColor(skin.color)
          .setDescription(
            t(lang, "premiumReset.cancelEmbed", {
              emoji: skin.emoji,
            })
          );

        return interaction.update({ embeds: [cancelEmbed], components: [] });
      }

      // Clicou Premium
      if (customId === "resetpremium_premium") {
        if (!hasAny) {
          const poolKey = lang === "en-US" ? "premiumReset.trashTalk.en" : "premiumReset.trashTalk.pt";
          const list = t(lang, poolKey);
          const msg = Array.isArray(list) ? pickRandom(list) : "Premium locked.";

          return safeReply(interaction, { ephemeral: true, content: `❌ ${msg}` });
        }

        const skin = getPremiumSkin(member);

        const embed = new EmbedBuilder()
          .setColor(skin.color)
          .setDescription(
            t(lang, "premiumReset.confirmEmbed", {
              emoji: skin.emoji,
            })
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("resetpremium_confirm_yes")
            .setLabel(lang === "en-US" ? "Yes" : "Sim")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("resetpremium_confirm_no")
            .setLabel(lang === "en-US" ? "No" : "Não")
            .setStyle(ButtonStyle.Danger)
        );

        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (customId === "resetpremium_confirm_yes") {
        const skin = getPremiumSkin(member);

        if (!isPresident(userId)) {
          const cd = canUsePremiumReset(userId);
          if (!cd.ok) {
            const unix = Math.floor(cd.nextAt / 1000);

            const embed = new EmbedBuilder()
              .setColor(skin.color)
              .setDescription(
                t(lang, "premiumReset.cooldownEmbed", {
                  emoji: skin.emoji,
                  whenFull: `<t:${unix}:F>`,
                  whenRelative: `<t:${unix}:R>`,
                })
              );

            return interaction.update({ embeds: [embed], components: [] });
          }
        }

        // ✅ reset base (public stats)
        resetCompetitivePublicStats(userId);

        // ========================================================
        // ✅ FIX DEFINITIVO:
        // /resetpremium agora também reseta Championships (campeonatos)
        // porque o resetCompetitivePublicStats não estava resetando esse campo.
        // ========================================================
        try {
          const db = getDb();

          db.prepare(
            `
            UPDATE competitive_profile
            SET championships = 0
            WHERE userId = ?
            `
          ).run(userId);
        } catch (e) {
          logger.error("Falha ao resetar championships no /resetpremium.", e);
          // não quebra o comando, pois o reset do resto já foi feito
        }

        const usedAt = markPremiumResetUsed(userId);

        const nextAt = usedAt + COOLDOWN_MS;
        const unix = Math.floor(nextAt / 1000);

        const okEmbed = new EmbedBuilder()
          .setColor(skin.color)
          .setDescription(
            t(lang, "premiumReset.successEmbed", {
              emoji: skin.emoji,
              whenFull: `<t:${unix}:F>`,
              whenRelative: `<t:${unix}:R>`,
            })
          );

        return interaction.update({ embeds: [okEmbed], components: [] });
      }
    } catch (err) {
      logger.error("Erro no Premium Reset", err);

      // ✅ Anti 40060 (Interaction already acknowledged)
      // se já foi acknowledged (update/defer), usa followUp
      if (interaction.replied || interaction.deferred) {
        return safeReply(interaction, {
          ephemeral: true,
          content: t(lang, "COMMON_ERROR_GENERIC"),
        });
      }

      return safeReply(interaction, {
        ephemeral: true,
        content: t(lang, "COMMON_ERROR_GENERIC"),
      });
    }
  }

  // ========================================================
  // LANGUAGE PANEL BUTTONS (v1.2)
  // ========================================================
  if (customId === "lang_set_ptbr" || customId === "lang_set_enus") {
    try {
      const chosen = customId === "lang_set_ptbr" ? "pt-BR" : "en-US";

      const {
        canChangeLanguage,
        getTimeLeftToChangeLanguage,
        markLanguageChange,
        setUserLanguageDb,
      } = require("../../modules/global/language/language.service");

      if (!isPresident(userId)) {
        const ok = canChangeLanguage(userId);
        if (!ok) {
          const left = getTimeLeftToChangeLanguage(userId);
          return safeReply(interaction, {
            ephemeral: true,
            content: t(lang, "LANG_COOLDOWN", { time: left }),
          });
        }
      }

      setUserLang(userId, chosen);

      try {
        setUserLanguageDb(userId, chosen);
      } catch (e) {
        logger.error("Erro registrando setUserLanguageDb no SQLite.", e);
      }

      try {
        markLanguageChange(userId);
      } catch (e) {
        logger.error("Erro registrando markLanguageChange no SQLite.", e);
      }

      let msg = "";
      if (chosen === "pt-BR") {
        msg = lang === "en-US" ? t("en-US", "LANG_CHANGED_PT") : t("pt-BR", "LANG_CHANGED");
      } else {
        msg = lang === "pt-BR" ? t("pt-BR", "LANG_CHANGED_EN") : t("en-US", "LANG_CHANGED");
      }

      return safeReply(interaction, { ephemeral: true, content: msg });
    } catch (err) {
      logger.error("Erro no botão de idioma", err);
      return safeReply(interaction, {
        ephemeral: true,
        content: t(lang, "COMMON_ERROR_GENERIC"),
      });
    }
  }

  // ========================================================
  // GAMEPLAY STYLE PANEL BUTTONS (v1.3)
  // ========================================================
  if (customId === "gameplay_set_casual" || customId === "gameplay_set_competitive") {
    try {
      const chosenStyle =
        customId === "gameplay_set_casual"
          ? GAMEPLAY_STYLES.CASUAL
          : GAMEPLAY_STYLES.COMPETITIVE;

      const member = await interaction.guild.members.fetch(userId);

      const roleCasual = azyron.roles.casual;
      const roleCompetitive = azyron.roles.competitive;

      const hasCasualRole = roleCasual ? member.roles.cache.has(roleCasual) : false;
      const hasCompetitiveRole = roleCompetitive ? member.roles.cache.has(roleCompetitive) : false;
      const hasAnyGameplayRole = hasCasualRole || hasCompetitiveRole;

      const dbStyle = getGameplayStyle(userId);
      if (dbStyle && !hasAnyGameplayRole) {
        clearGameplayStyle(userId);
      }

      const choosePool = lang === "en-US" ? chooseMsgsEN : chooseMsgsPT;
      const lockedPool = lang === "en-US" ? lockedMsgsEN : lockedMsgsPT;

      if (isPresident(userId)) {
        const forced = setGameplayStyleForce(userId, chosenStyle);

        if (!forced.ok) {
          return safeReply(interaction, {
            ephemeral: true,
            content:
              lang === "en-US" ? "⚠️ Failed to set your playstyle." : "⚠️ Falha ao definir seu estilo de jogo.",
          });
        }

        if (chosenStyle === GAMEPLAY_STYLES.CASUAL) {
          if (roleCompetitive) await member.roles.remove(roleCompetitive).catch(() => {});
          if (roleCasual) await member.roles.add(roleCasual).catch(() => {});
        } else {
          if (roleCasual) await member.roles.remove(roleCasual).catch(() => {});
          if (roleCompetitive) await member.roles.add(roleCompetitive).catch(() => {});
        }

        const msg = pickRandom(choosePool[chosenStyle]);
        return safeReply(interaction, { ephemeral: true, content: `✅ ${msg}` });
      }

      const result = setGameplayStyleOnce(userId, chosenStyle);

      if (!result.ok && result.reason === "ALREADY_SET") {
        const msg = pickRandom(lockedPool[result.style]);
        return safeReply(interaction, { ephemeral: true, content: msg });
      }

      if (!result.ok) {
        return safeReply(interaction, {
          ephemeral: true,
          content: t(lang, "COMMON_ERROR_GENERIC"),
        });
      }

      if (chosenStyle === GAMEPLAY_STYLES.CASUAL) {
        if (roleCompetitive) await member.roles.remove(roleCompetitive).catch(() => {});
        if (roleCasual) await member.roles.add(roleCasual).catch(() => {});
      } else {
        if (roleCasual) await member.roles.remove(roleCasual).catch(() => {});
        if (roleCompetitive) await member.roles.add(roleCompetitive).catch(() => {});
      }

      const msg = pickRandom(choosePool[chosenStyle]);
      return safeReply(interaction, { ephemeral: true, content: `✅ ${msg}` });
    } catch (err) {
      logger.error("Erro nos botões gameplay", err);
      return safeReply(interaction, {
        ephemeral: true,
        content: lang === "en-US" ? "⚠️ Failed to set your playstyle." : "⚠️ Falha ao definir seu estilo de jogo.",
      });
    }
  }

  // ========================================================
  // Botão desconhecido
  // ========================================================
  return safeReply(interaction, {
    ephemeral: true,
    content: lang === "en-US" ? "⚠️ Button not recognized." : "⚠️ Botão não reconhecido.",
  });
};
