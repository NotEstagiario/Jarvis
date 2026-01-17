// src/modules/competitive/matches/match.guard.js

// ========================================================
// Competitive Guard (v2.0)
// ========================================================

const azyron = require("../../../config/azyronIds");
const { t } = require("../../../i18n");
const { getUserLang } = require("../../../utils/lang");

const { userHasAnyLock } = require("./match.service");

function getConfrontosChannelId() {
  return azyron?.channels?.competitiveConfrontos || null;
}

function hasCompetitiveRole(member) {
  const roleId = azyron?.roles?.competitive || null;
  if (!roleId) return false;
  return member?.roles?.cache?.has(roleId);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ========================================================
// Emojis (Word)
// ========================================================
const EMOJI_COMPETITIVE = "<:bensa_evil:1453193952277827680>";

function ensureCanUseCompetitive(interaction) {
  const userId = interaction.user.id;
  const lang = getUserLang(userId);

  // 1) guild only
  if (!interaction.inGuild()) {
    return {
      ok: false,
      reply: {
        ephemeral: true,
        content: t(lang, "COMP_ONLY_GUILD"),
      },
    };
  }

  // 2) canal confrontos
  const confrontosId = getConfrontosChannelId();

  if (!confrontosId) {
    return {
      ok: false,
      reply: {
        ephemeral: true,
        content:
          lang === "en-US"
            ? "⚠️ Competitive confrontos channel is not configured."
            : "⚠️ Canal confrontos do competitivo não está configurado.",
      },
    };
  }

  if (interaction.channelId !== confrontosId) {
    return {
      ok: false,
      reply: {
        ephemeral: true,
        content: t(lang, "COMP_ONLY_CONFRONTOS", { channel: `<#${confrontosId}>` }),
      },
    };
  }

  // 3) precisa role competitive
  if (!hasCompetitiveRole(interaction.member)) {
    return {
      ok: false,
      reply: {
        ephemeral: true,
        content: t(lang, "COMP_ONLY_ROLE"),
      },
    };
  }

  // ========================================================
  // ✅ LOCK SYSTEM (v2.0)
  // - 1 lock por player
  // - trash talks rotativos por etapa
  // - SEM token nos locks de menu/setup/confirm/invite/active
  // ========================================================
  const lock = userHasAnyLock(userId);

  if (lock) {
    const lockType = String(lock.lockType || "").toLowerCase();

    // --------------------------------------------------------
    // ACTIVE (match em vigor) => trash talk SEM token
    // --------------------------------------------------------
    if (lockType === "active") {
      const pool =
        lang === "en-US"
          ? [
              `${EMOJI_COMPETITIVE} One match at a time. Ranked isn’t a buffet.`,
              `${EMOJI_COMPETITIVE} You already have a match. Finish it first.`,
              `${EMOJI_COMPETITIVE} Stop trying to open another match — play the one you started.`,
              `${EMOJI_COMPETITIVE} Bro… you’re already in a match. Focus.`,
              `${EMOJI_COMPETITIVE} Another match? Nah. Handle the current one.`,
              `${EMOJI_COMPETITIVE} You’re not farming challenges today.`,
              `${EMOJI_COMPETITIVE} You want more? Win the one you’re in first.`,
              `${EMOJI_COMPETITIVE} Ranked is discipline. Not spam.`,
              `${EMOJI_COMPETITIVE} If you can’t finish one match, you don’t deserve two.`,
              `${EMOJI_COMPETITIVE} Finish your fight before asking for a new one.`,
            ]
          : [
              `${EMOJI_COMPETITIVE} Mano… um confronto por vez. Ranked não é rodízio.`,
              `${EMOJI_COMPETITIVE} Tu já tem confronto em vigor. Termina esse primeiro.`,
              `${EMOJI_COMPETITIVE} Quer abrir outro confronto? Ganha o atual antes.`,
              `${EMOJI_COMPETITIVE} Não tenta farmar desafio não. Vai jogar.`,
              `${EMOJI_COMPETITIVE} Se começou, agora aguenta até o final.`,
              `${EMOJI_COMPETITIVE} Mais um confronto? Não. Resolve o que você abriu.`,
              `${EMOJI_COMPETITIVE} Se não consegue finalizar um, não merece dois.`,
              `${EMOJI_COMPETITIVE} Ranked é disciplina, não spam.`,
              `${EMOJI_COMPETITIVE} Tá achando que aqui é fila de fast-food?`,
              `${EMOJI_COMPETITIVE} Termina o confronto atual antes de pedir outro.`,
            ];

      return {
        ok: false,
        reply: {
          ephemeral: true,
          content: pickRandom(pool),
        },
      };
    }

    // --------------------------------------------------------
    // PENDING_MENU => abriu a 1ª embed (2 botões)
    // --------------------------------------------------------
    if (lockType === "pending_menu") {
      const pool =
        lang === "en-US"
          ? [
              `🧠 You already opened the challenge menu — pick an option.`,
              `😈 Menu is open. Stop panicking and choose.`,
              `${EMOJI_COMPETITIVE} You’re staring at the buttons… click one.`,
              `🎮 You already started it. Decide: opponent or search.`,
              `⚔️ Don’t spam /desafiar. Choose your path.`,
              `🛑 Menu is already open. No duplicates.`,
              `${EMOJI_COMPETITIVE} Stop hesitating. Make a choice.`,
              `😅 You opened the menu twice? That’s not how ranked works.`,
              `📌 You’re already in the challenge menu. Choose.`,
              `${EMOJI_COMPETITIVE} Click a button or stay scared.`,
            ]
          : [
              `🧠 Você já abriu o menu do desafio — escolhe uma opção.`,
              `😈 O menu já tá aberto. Para de tremer e escolhe.`,
              `${EMOJI_COMPETITIVE} Tá encarando os botões… clica em um.`,
              `🎮 Você já começou. Decide: adversário ou procura.`,
              `⚔️ Para de spammar /desafiar. Escolhe teu caminho.`,
              `🛑 Menu já tá aberto. Nada de duplicar.`,
              `${EMOJI_COMPETITIVE} Para de hesitar. Faz tua escolha.`,
              `😅 Abriu o menu duas vezes? Ranked não funciona assim.`,
              `📌 Você já tá no menu do desafio. Escolhe aí.`,
              `${EMOJI_COMPETITIVE} Clica em um botão ou continua com medo.`,
            ];

      return {
        ok: false,
        reply: {
          ephemeral: true,
          content: pickRandom(pool),
        },
      };
    }

    // --------------------------------------------------------
    // PENDING_SETUP => etapa "Envie seu adversário" (aguardando @ no chat)
    // --------------------------------------------------------
    if (lockType === "pending_setup") {
      const pool =
        lang === "en-US"
          ? [
              `🎯 You’re in the middle of it — send the @ already.`,
              `🗣️ Type the opponent @. Don’t waste my time.`,
              `${EMOJI_COMPETITIVE} Stop typing /desafiar and tag your opponent.`,
              `⏳ You have 60 seconds. Tag someone and fight.`,
              `😈 You started the challenge. Now name your victim.`,
              `📣 Tag the opponent instead of opening more menus.`,
              `🧠 You’re already in the setup. Send the @.`,
              `${EMOJI_COMPETITIVE} Courage? Then tag the opponent.`,
              `⚔️ Mid-process. No escapes. Send the @.`,
              `💀 Stop running. Mention the opponent.`,
            ]
          : [
              `🎯 Você tá no meio do processo — manda o @ logo.`,
              `🗣️ Marca o adversário no chat. Não enrola.`,
              `${EMOJI_COMPETITIVE} Para de dar /desafiar e marca o cara.`,
              `⏳ Você tem 60 segundos. Marca alguém e vai pra guerra.`,
              `😈 Começou o desafio. Agora escolhe a vítima.`,
              `📣 Marca o adversário ao invés de abrir menu de novo.`,
              `🧠 Você já tá na seleção. Manda o @.`,
              `${EMOJI_COMPETITIVE} Coragem? Então marca o adversário.`,
              `⚔️ Processo em andamento. Sem fuga. Envia o @.`,
              `💀 Para de correr e menciona o adversário.`,
            ];

      return {
        ok: false,
        reply: {
          ephemeral: true,
          content: pickRandom(pool),
        },
      };
    }

    // --------------------------------------------------------
    // PENDING_CONFIRM => tela Confirmar/Cancelar
    // --------------------------------------------------------
    if (lockType === "pending_confirm") {
      const pool =
        lang === "en-US"
          ? [
              `✅ You already picked the opponent — now confirm or cancel.`,
              `😈 Opponent selected. Stop stalling and click Confirm.`,
              `${EMOJI_COMPETITIVE} No fear now. Confirm it.`,
              `🛑 You’re at confirmation. Choose: Confirm or Cancel.`,
              `⚔️ You already named the opponent. Finish the job.`,
              `🎮 Confirm it or back out — but stop spamming.`,
              `${EMOJI_COMPETITIVE} Press Confirm or admit you’re scared.`,
              `⏳ You’re on the final step. Decide.`,
              `📌 You already selected the opponent. Confirm.`,
              `💀 Confirm or cancel — no third option.`,
            ]
          : [
              `✅ Você já escolheu o adversário — agora confirma ou cancela.`,
              `😈 Adversário escolhido. Para de enrolar e confirma.`,
              `${EMOJI_COMPETITIVE} Agora não arregona. Confirma logo.`,
              `🛑 Você tá na confirmação. Confirmar ou Cancelar.`,
              `⚔️ Você já marcou o adversário. Finaliza a missão.`,
              `🎮 Confirma ou recua — mas para de spammar.`,
              `${EMOJI_COMPETITIVE} Clica em Confirmar ou admite que tá com medo.`,
              `⏳ Tá no último passo. Decide.`,
              `📌 Você já escolheu o adversário. Confirma aí.`,
              `💀 Confirma ou cancela — não existe terceira opção.`,
            ];

      return {
        ok: false,
        reply: {
          ephemeral: true,
          content: pickRandom(pool),
        },
      };
    }

    // --------------------------------------------------------
    // PENDING_INVITE => invite enviado aguardando aceitar/recusar
    // --------------------------------------------------------
    if (lockType === "pending_invite") {
      const pool =
        lang === "en-US"
          ? [
              `📩 Invite already sent — wait for them to accept or decline.`,
              `😈 You already sent the invite. Now wait like a grown-up.`,
              `${EMOJI_COMPETITIVE} Invite is out. No double-challenges.`,
              `⏳ Waiting on opponent. Stop trying to speedrun.`,
              `🛑 Invite pending. Don’t open another one.`,
              `⚔️ The ball is in their court. Chill.`,
              `${EMOJI_COMPETITIVE} Patience. Let them accept or run.`,
              `🎮 You can’t stack invites. Ranked isn’t Tinder.`,
              `📌 Invite sent. Wait for the response.`,
              `💀 One invite at a time. Respect the system.`,
            ]
          : [
              `📩 Você já enviou o convite — aguarde ele aceitar ou recusar.`,
              `😈 Convite já foi. Agora espera como gente grande.`,
              `${EMOJI_COMPETITIVE} O convite tá na rua. Nada de desafio duplo.`,
              `⏳ Tá esperando o adversário. Para de tentar rushar.`,
              `🛑 Convite pendente. Não abre outro.`,
              `⚔️ Agora é com ele. Respira.`,
              `${EMOJI_COMPETITIVE} Paciência. Deixa ele aceitar ou correr.`,
              `🎮 Não dá pra empilhar convite. Ranked não é Tinder.`,
              `📌 Convite enviado. Aguarda a resposta.`,
              `💀 Um convite por vez. Respeita o sistema.`,
            ];

      return {
        ok: false,
        reply: {
          ephemeral: true,
          content: pickRandom(pool),
        },
      };
    }

    // --------------------------------------------------------
    // fallback (qualquer lock antigo)
    // --------------------------------------------------------
    return {
      ok: false,
      reply: {
        ephemeral: true,
        content: t(lang, "COMP_LOCKED", { type: lock.lockType, token: lock.token || "-" }),
      },
    };
  }

  return { ok: true };
}

module.exports = {
  ensureCanUseCompetitive,
};
