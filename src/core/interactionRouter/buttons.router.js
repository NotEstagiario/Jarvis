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
// - Botões do /perfil (profile_*) são tratados DENTRO do comando
//   via collector. Aqui nós DEVEMOS IGNORAR.
// ========================================================

const logger = require("../logger");
const azyron = require("../../config/azyronIds");

const { t } = require("../../i18n");
const { getUserLang, setUserLang } = require("../../utils/lang");

const {
  setGameplayStyleOnce,
  setGameplayStyleForce,
  clearGameplayStyle,
  getGameplayStyle,
  STYLES: GAMEPLAY_STYLES,
} = require("../../modules/global/gameplay/gameplay.service");

// ========================================================
// DEBUG anti-spam (Word)
// - Em produção NÃO pode poluir terminal com clique de botão
// - Para ativar logs: DEBUG_BUTTONS=true no .env
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
// Handler principal
// ========================================================
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId } = interaction;
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  // ========================================================
  // ✅ /perfil buttons (LOCAL collector)
  // ========================================================
  if (customId.startsWith("profile_")) return;

  // ✅ Anti-spam terminal: loga só se DEBUG_BUTTONS=true
  if (DEBUG_BUTTONS) {
    logger.info(`[BTN] ${customId} por ${interaction.user.tag} (${userId})`);
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

      // ========================================================
      // Pega member + roles atuais
      // ========================================================
      const member = await interaction.guild.members.fetch(userId);

      const roleCasual = azyron.roles.casual; // 1457362198216179961
      const roleCompetitive = azyron.roles.competitive; // 1457347614147215391

      const hasCasualRole = roleCasual ? member.roles.cache.has(roleCasual) : false;
      const hasCompetitiveRole = roleCompetitive ? member.roles.cache.has(roleCompetitive) : false;
      const hasAnyGameplayRole = hasCasualRole || hasCompetitiveRole;

      // ========================================================
      // Se DB diz que tem escolha, mas ele não tem role nenhuma:
      // -> libera escolher de novo
      // ========================================================
      const dbStyle = getGameplayStyle(userId);
      if (dbStyle && !hasAnyGameplayRole) {
        clearGameplayStyle(userId);
      }

      // ========================================================
      // Seleciona arrays por idioma (EN / PT)
      // ========================================================
      const choosePool = lang === "en-US" ? chooseMsgsEN : chooseMsgsPT;
      const lockedPool = lang === "en-US" ? lockedMsgsEN : lockedMsgsPT;

      // ========================================================
      // Presidente = bypass total
      // ========================================================
      if (isPresident(userId)) {
        const forced = setGameplayStyleForce(userId, chosenStyle);

        if (!forced.ok) {
          return safeReply(interaction, {
            ephemeral: true,
            content:
              lang === "en-US" ? "⚠️ Failed to set your playstyle." : "⚠️ Falha ao definir seu estilo de jogo.",
          });
        }

        // aplica cargos
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

      // ========================================================
      // Normal: escolher UMA vez
      // ========================================================
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

      // aplica cargos
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
