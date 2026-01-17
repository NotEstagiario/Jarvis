// src/modules/competitive/matches/match.presenter.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUserLang } = require("../../../utils/lang");
const { t } = require("../../../i18n");

function safeColor(color, fallback = 0x2b2d31) {
  if (!color) return fallback;
  if (typeof color !== "number") return fallback;
  if (color <= 0) return fallback;
  return color;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function expiresField(lang, expiresAt) {
  const ts = Number(expiresAt || 0);
  if (!ts) return null;

  const unix = Math.floor(ts / 1000);

  return {
    name: lang === "en-US" ? "Time to expire" : "Tempo para expirar",
    value: `<t:${unix}:R>`,
    inline: true,
  };
}

// ========================================================
// Rotação da 1ª embed (rank rotation)
// ========================================================
const START_ROTATION = {
  "pt-BR": {
    unranked: [
      "# ⚔️ Sistema de Confrontos\n\nSem rank ainda? Então hoje é dia de começar a história.\n\nMe diz: **já tem adversário** ou quer que eu encontre alguém pra você?",
      "# ⚔️ Sistema de Confrontos\n\nTodo campeão já foi **Sem Rank** um dia.\n\nVocê já tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSem rank… por enquanto.\n\nVai desafiar alguém ou quer que eu ache um oponente à sua altura?",
      "# ⚔️ Sistema de Confrontos\n\nAzyron tá te olhando.\n\nVocê já tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSem rank não é vergonha… é só o começo.\n\nJá tem adversário ou quer que eu encontre um?",
      "# ⚔️ Sistema de Confrontos\n\nO ranked não sobe sozinho.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSua primeira vitória começa aqui.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAzyron não dá rank de presente.\n\nMe diz: já tem adversário ou quer que eu procure um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê tá a uma partida de deixar de ser “Sem Rank”.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora virar nome no competitivo.\n\nJá tem adversário ou quer que eu encontre um?",
      "# ⚔️ Sistema de Confrontos\n\nO primeiro passo é o mais difícil… então vamos logo.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSem rank com atitude vira rank com respeito.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá pronto pra parar de assistir e começar a jogar?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você quer subir… vai ter que sangrar um pouco.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nHoje você joga por um objetivo: sair do fundo.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNão existe rank impossível… só player preguiçoso.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora desbloquear seu rank de verdade.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você quer respeito, vai ter que buscar.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá pronto pra provar que não é só “Sem Rank”? 😈\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSem rank hoje… lenda amanhã.\n\nJá tem adversário ou quer procurar um?",
    ],
    copper: [
      "# ⚔️ Sistema de Confrontos\n\nCobre? Então bora parar de ser tutorial.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Cobre: onde os fortes começam.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe ficar no Cobre, vira decoração do servidor.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nCobre é o aquecimento.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê tá no Cobre… mas não nasceu pra isso.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nQuem sobe do Cobre vira casca grossa.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVamos tirar você desse rank de sobrevivência.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nCobre é onde a zoeira começa… e a evolução também.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPra sair do Cobre só tem um jeito: vitória.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSeja o Cobre que ninguém quer enfrentar.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Cobre = rank de coragem.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora transformar Cobre em degrau.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Cobre todo mundo fala… mas poucos vencem.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê é Cobre, mas joga como quê?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá na hora do Cobre sentir medo de você.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nCobre é só o começo do caos.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora sair do Cobre antes que vire residência fixa.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank baixo, ambição alta.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nMostra que você não é Cobre por destino.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nCobre é a forja. Vamos te temperar.\n\nJá tem adversário ou quer procurar um?",
    ],
    iron: [
      "# ⚔️ Sistema de Confrontos\n\nFerro… dá pra sentir o cheiro do Bronze.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Ferro: onde nasce o tryhard.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro é rank de quem aguenta pancada.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você é Ferro, bora virar aço.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui é ranked, não é passeio.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro não é ruim… ruim é desistir.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nQuem sobe do Ferro aprende a vencer na dor.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro é onde você prova que quer subir.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora tirar esse rank do caminho.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro não combina com ego. Combina com evolução.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTodo Bronze já foi Ferro.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Ferro: pare de errar, comece a dominar.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVai continuar no Ferro ou quer subir de verdade?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro é só fase… né? 😈\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAgora é guerra por respeito.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Ferro, a vitória é suada e deliciosa.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora endurecer o jogo.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nQuer virar lenda? Começa vencendo aqui.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nFerro hoje, Bronze amanhã.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você tá no Ferro, é porque já tem coragem.\n\nJá tem adversário ou quer procurar um?",
    ],
    bronze: [
      "# ⚔️ Sistema de Confrontos\n\nBronze é rank de quem acordou.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Bronze, a diferença é mental.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze não é fim… é metade do caminho.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora mostrar que seu Bronze não é de enfeite.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze com fome vira Prata.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui já começa o respeito.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você tá no Bronze, já sabe lutar.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nChega de Bronze, bora subir.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze é rank de quem quer aprender com derrota.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui já tem gente perigosa.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze sem medo vira monstro.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVai jogar sério ou vai colecionar derrota?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze é onde muitos travam.\n\nVocê vai travar também ou quer subir?",
      "# ⚔️ Sistema de Confrontos\n\nBora deixar esse rank pequeno.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê já não é iniciante.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze hoje… Prata piscando ali.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Bronze, quem hesita perde.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSeja o Bronze que humilha Prata.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBora brincar de subir rank?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBronze com disciplina vira elite.\n\nJá tem adversário ou quer procurar um?",
    ],
    silver: [
      "# ⚔️ Sistema de Confrontos\n\nPrata: onde o ego aparece.\n\nE a derrota também.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Prata: agora é sério.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata é o rank da consistência.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro tá logo ali… mas vai ter que merecer.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você é Prata, já é ameaça.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata é onde o player nasce.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui a zoeira é menor… mas a pressão é maior.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro não respeita Prata que chora.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê tá na Prata: hora de virar constante.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata é rank de quem já venceu de verdade.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá pronto pra encarar o próximo nível?\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata: onde o erro custa caro.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAzyron tá cheio de Prata confiante.\n\nVamos ver você.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata com mental vira Ouro.\n\nPrata com ego vira meme.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá querendo subir, né?\n\nEntão para de brincar.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAgora é onde os bons se separam dos medianos.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro já tá te esperando… ou te caçando.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nPrata é rank de “quase”.\n\nVamos virar rank de “consegui”.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Prata você aprende a ganhar bonito.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá na Prata? Então já pode apanhar de Ouro.\n\nJá tem adversário ou quer procurar um?",
    ],
    gold: [
      "# ⚔️ Sistema de Confrontos\n\nOuro: aqui já tem história.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Ouro: onde todo mundo se acha bom.\n\nAgora prova.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Ouro, você não sobe… você conquista.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante não respeita Ouro fraco.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro: aqui é elite… mas ainda não é topo.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Ouro a derrota dói mais.\n\nMas também ensina.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro com mental vira Diamante.\n\nOuro com ego vira queda.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê tá no Ouro… agora ninguém te subestima.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Ouro: o lobby já te respeita.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro é rank de guerreiro.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nVocê tá perto do topo.\n\nVamos ver se aguenta.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui não tem “partida fácil”.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro já bate de frente.\n\nDiamante finaliza.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro é onde os perigosos moram.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nQuem domina no Ouro vira nome no servidor.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro: tem que jogar limpo e jogar bem.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá pronto pra apanhar de Diamante? 😈\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você é Ouro, então pare de jogar como Prata.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nQuem fica no Ouro por muito tempo… começa a virar NPC.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nOuro é luxo.\n\nDiamante é legado.\n\nJá tem adversário ou quer procurar um?",
    ],
    diamond: [
      "# ⚔️ Sistema de Confrontos\n\nDiamante: aqui ninguém é fraco.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nRank Diamante: o topo te observa.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante: uma derrota aqui vira lenda.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Diamante, você não joga… você dita regra.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante é onde o ego morre e a técnica vive.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nSe você é Diamante, então o servidor já te conhece.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante: onde qualquer erro vira humilhação.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante não pede respeito.\n\nDiamante toma.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nBem-vindo ao rank dos monstros.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante: o jogo começa aqui.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo Diamante, ninguém quer perder.\n\nEntão não perde.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante é onde a rivalidade vira arte.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nTá no topo? Então aguenta o peso.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante: o rank onde você vira história.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nAqui ninguém entra por sorte.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante é privilégio.\n\nE responsabilidade.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante: seu nome vale mais que seu XP.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nNo topo, não existe descanso.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nO topo é frio.\n\nMas você já sabia.\n\nJá tem adversário ou quer procurar um?",
      "# ⚔️ Sistema de Confrontos\n\nDiamante… então para de perder tempo e desafia logo.\n\nJá tem adversário ou quer procurar um?",
    ],
  },

  "en-US": {
    unranked: [
      "# ⚔️ Match System\n\nUnranked? Good. That means your story starts now.\n\nDo you already have an opponent or should I find one for you?",
      "# ⚔️ Match System\n\nEvery champion was **Unranked** once.\n\nDo you already have an opponent or should I search for one?",
      "# ⚔️ Match System\n\nUnranked… for now.\n\nDo you have an opponent or should I find one?",
      "# ⚔️ Match System\n\nAzyron is watching.\n\nDo you already have an opponent or should I search for one?",
      "# ⚔️ Match System\n\nUnranked isn’t shame. It’s the beginning.\n\nDo you have an opponent or should I find one?",
      "# ⚔️ Match System\n\nRank doesn’t climb itself.\n\nDo you have an opponent or should I search for one?",
      "# ⚔️ Match System\n\nYour first win starts right here.\n\nDo you have an opponent or should I find one?",
      "# ⚔️ Match System\n\nAzyron doesn’t hand out ranks.\n\nDo you have an opponent or should I search for one?",
      "# ⚔️ Match System\n\nOne match away from being taken seriously.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nTime to become a name in competitive.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nFirst step is the hardest — let’s do it.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nUnranked with confidence becomes ranked with respect.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nReady to stop watching and start winning?\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIf you want to climb, you’ll sweat for it.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nToday you play for one goal: get out of the bottom.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nNo impossible rank. Only lazy players.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nLet’s unlock your real rank.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIf you want respect, go earn it.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nReady to prove you’re not “Unranked” material? 😈\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nUnranked today… legend tomorrow.\n\nOpponent ready or should I search one?",
    ],
    copper: [
      "# ⚔️ Match System\n\nCopper? Time to stop playing tutorial.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nCopper rank: where real players start.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nStay in Copper too long and you become server decoration.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nCopper is warm-up.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nYou’re Copper… but you weren’t born for this.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nClimbing out of Copper builds monsters.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nLet’s get you out of survival rank.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nCopper is where the jokes start… and growth too.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nOnly one way out of Copper: wins.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nBe the Copper nobody wants to face.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nCopper = courage rank.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nMake Copper a step, not a home.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIn Copper everyone talks… few win.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nYou’re Copper — but do you play like what?\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nTime for Copper to fear you.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nCopper is just the beginning of chaos.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nLeave Copper before it becomes permanent address.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nLow rank. High ambition.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nProve Copper isn’t your destiny.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nCopper is the forge. Let’s temper you.\n\nOpponent ready or should I find one?",
    ],
    iron: [
      "# ⚔️ Match System\n\nIron… you can smell Bronze already.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIron rank: where tryhards are born.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIron is for those who can take punches.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIf you’re Iron, let’s become steel.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nThis is ranked, not a picnic.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIron isn’t bad. Quitting is.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nClimbing from Iron teaches painful wins.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIron is where you prove you deserve to climb.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nLet’s remove this rank from your path.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIron needs growth, not ego.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nEvery Bronze was Iron once.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIron: stop missing, start dominating.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nStay Iron… or climb for real?\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIron is just a phase… right? 😈\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nNow you fight for respect.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIn Iron, wins are hard — and delicious.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nTime to harden your gameplay.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nWant to be a legend? Start winning here.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIron today, Bronze tomorrow.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIf you’re Iron, at least you’ve got courage.\n\nOpponent ready or should I find one?",
    ],
    bronze: [
      "# ⚔️ Match System\n\nBronze means you woke up.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIn Bronze, the difference is mindset.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nBronze isn’t the end — it’s the midpoint.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nShow Bronze isn’t just decoration.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nHungry Bronze becomes Silver.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nRespect starts here.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIf you’re Bronze, you already know how to fight.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nEnough Bronze. Time to climb.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nBronze teaches you through losses.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nNow you’ll face dangerous players.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nFearless Bronze becomes a problem.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nAre you playing serious or collecting L’s?\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nBronze is where many get stuck.\n\nWill you get stuck too?",
      "# ⚔️ Match System\n\nMake this rank feel small.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nYou’re not a beginner anymore.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nBronze today… Silver is calling.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIn Bronze, hesitation loses.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nBe the Bronze that humiliates Silver.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nWant a faster climb? Start now.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDisciplined Bronze becomes elite.\n\nOpponent ready or should I find one?",
    ],
    silver: [
      "# ⚔️ Match System\n\nSilver: ego rises… and so does punishment.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nSilver rank: now it’s serious.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nSilver is the rank of consistency.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold is close… but you must earn it.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIf you’re Silver, you’re already a threat.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nThis is where players are born.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nLess jokes, more pressure.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold doesn’t respect whining Silvers.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nTime to become consistent.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nSilver means you’ve earned real wins.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nReady for the next level?\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIn Silver, mistakes are expensive.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nAzyron is full of confident Silvers.\n\nLet’s see you.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nSilver with mindset becomes Gold.\n\nSilver with ego becomes a meme.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nYou want to climb, right?\n\nThen stop playing around.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nNow the good separate from the average.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold is either waiting… or hunting you.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nSilver is “almost”.\n\nLet’s turn it into “I did it”.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nSilver teaches you to win clean.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nSilver rank? Time to take hits from Gold.\n\nOpponent ready or should I find one?",
    ],
    gold: [
      "# ⚔️ Match System\n\nGold: now you’ve got history.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nGold rank: everyone thinks they’re good.\n\nNow prove it.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIn Gold you don’t climb — you conquer.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDiamond doesn’t respect weak Golds.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold is elite… but not the top.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIn Gold, losing hurts more.\n\nBut teaches more too.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold with mindset becomes Diamond.\n\nGold with ego becomes downfall.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nYou’re Gold — nobody underestimates you.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold rank: the lobby respects you.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nGold is warrior rank.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nClose to the top.\n\nLet’s see if you can handle it.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nNo “easy match” here.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nGold fights.\n\nDiamond finishes.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nGold is where dangerous players live.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDominate Gold and you become a server name.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nGold requires clean play and sharp skill.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nReady to get humbled by Diamond? 😈\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIf you’re Gold, stop playing like Silver.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nStay in Gold too long… you start becoming NPC.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nGold is luxury.\n\nDiamond is legacy.\n\nOpponent ready or should I find one?",
    ],
    diamond: [
      "# ⚔️ Match System\n\nDiamond: nobody here is weak.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond rank: the top is watching.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nIn Diamond, one loss becomes a story.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIn Diamond, you don’t play — you set the rules.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDiamond is where ego dies and skill lives.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nIf you’re Diamond, the server already knows you.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDiamond: one mistake becomes humiliation.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond doesn’t ask for respect.\n\nDiamond takes it.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nWelcome to monster rank.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond: the game starts here.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nAt the top, nobody wants to lose.\n\nSo don’t.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond: where rivalry becomes art.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nYou’re at the top.\n\nNow carry the weight.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDiamond rank: where you become history.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nNobody reaches Diamond by luck.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond is privilege.\n\nAnd responsibility.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nDiamond: your name is worth more than XP.\n\nOpponent ready or should I find one?",
      "# ⚔️ Match System\n\nAt the top, there’s no rest.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nThe top is cold.\n\nBut you knew that.\n\nOpponent ready or should I search one?",
      "# ⚔️ Match System\n\nDiamond… stop wasting time and challenge already.\n\nOpponent ready or should I search one?",
    ],
  },
};

// ========================================================
// helpers: rank -> key
// ========================================================
function normalizeRankKey(rankKey) {
  const k = String(rankKey || "").toLowerCase();
  if (!k || k === "unranked" || k === "sem rank" || k === "sem_rank" || k === "none") return "unranked";
  if (k.includes("copper") || k.includes("cobre")) return "copper";
  if (k.includes("iron") || k.includes("ferro")) return "iron";
  if (k.includes("bronze")) return "bronze";
  if (k.includes("silver") || k.includes("prata")) return "silver";
  if (k.includes("gold") || k.includes("ouro")) return "gold";
  if (k.includes("diamond") || k.includes("diamante")) return "diamond";
  return "unranked";
}

function pickStartDesc(lang, rankKey) {
  const dict = START_ROTATION[lang] || START_ROTATION["pt-BR"];
  const key = normalizeRankKey(rankKey);
  const pool = dict[key] || dict.unranked;
  return pickRandom(pool);
}

// ========================================================
// Embeds
// ========================================================
function buildStartEmbed(userId, color, rankKey, expiresAt = null) {
  const lang = getUserLang(userId);
  const desc = pickStartDesc(lang, rankKey);

  const embed = new EmbedBuilder().setDescription(desc).setColor(safeColor(color));

  const field = expiresField(lang, expiresAt);
  if (field) embed.addFields(field);

  return embed;
}

function buildStartButtons(userId) {
  const lang = getUserLang(userId);

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("challenge_have_opponent")
        .setLabel(t(lang, "CHALLENGE_BTN_HAVE_OPP"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("challenge_search_opponent")
        .setLabel(t(lang, "CHALLENGE_BTN_SEARCH_OPP"))
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function buildAskOpponentEmbed(userId, color, expiresAt = null) {
  const lang = getUserLang(userId);

  const embed = new EmbedBuilder()
    .setTitle(t(lang, "CHALLENGE_ASK_TITLE"))
    .setDescription(t(lang, "CHALLENGE_ASK_DESC"))
    .setColor(safeColor(color));

  const field = expiresField(lang, expiresAt);
  if (field) embed.addFields(field);

  return embed;
}

function buildConfirmEmbed(userId, opponentId, color, expiresAt = null) {
  const lang = getUserLang(userId);

  const embed = new EmbedBuilder()
    .setTitle(t(lang, "CHALLENGE_CONFIRM_TITLE"))
    .setDescription(t(lang, "CHALLENGE_CONFIRM_DESC", { opponent: `<@${opponentId}>` }))
    .setColor(safeColor(color));

  const field = expiresField(lang, expiresAt);
  if (field) embed.addFields(field);

  return embed;
}

function buildConfirmButtons(userId) {
  const lang = getUserLang(userId);

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("challenge_confirm")
        .setLabel(t(lang, "CHALLENGE_BTN_CONFIRM"))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("challenge_abort")
        .setLabel(t(lang, "CHALLENGE_BTN_CANCEL"))
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

// ========================================================
// Invite embed (opponent accept)
// ========================================================
function buildInviteEmbed({ challengerId, opponentId, lang, color, expiresAt }) {
  const unix = Math.floor(expiresAt / 1000);

  return new EmbedBuilder()
    .setTitle(t(lang, "CHALLENGE_INVITE_TITLE"))
    .setDescription(t(lang, "CHALLENGE_INVITE_DESC", { challenger: `<@${challengerId}>` }))
    .addFields(
      { name: t(lang, "CHALLENGE_INVITE_PLAYERS"), value: `<@${challengerId}> vs <@${opponentId}>`, inline: false },
      { name: t(lang, "CHALLENGE_INVITE_EXPIRES"), value: `<t:${unix}:R>`, inline: true }
    )
    .setColor(safeColor(color));
}

function buildInviteButtons(inviteId, lang) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`challenge_accept_${inviteId}`)
        .setLabel(t(lang, "CHALLENGE_BTN_ACCEPT"))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`challenge_decline_${inviteId}`)
        .setLabel(t(lang, "CHALLENGE_BTN_DECLINE"))
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

// ========================================================
// Match embed pública: COR DO STATUS
// severity: ok|warn|critical
// ========================================================
function buildMatchPublicEmbed(challengerId, opponentId, tokenFull, color, lang, expiresAt, severity = "ok") {
  const unix = Math.floor(Number(expiresAt || 0) / 1000);

  let statusColor = 0x2ecc71;
  if (severity === "warn") statusColor = 0xf1c40f;
  if (severity === "critical") statusColor = 0xe74c3c;

  return new EmbedBuilder()
    .setTitle(t(lang, "MATCH_ACTIVE_TITLE"))
    .setDescription(t(lang, "MATCH_ACTIVE_DESC"))
    .addFields(
      { name: t(lang, "MATCH_ACTIVE_PLAYERS"), value: `<@${challengerId}> vs <@${opponentId}>`, inline: false },
      { name: t(lang, "MATCH_ACTIVE_TOKEN"), value: `\`${tokenFull}\``, inline: true },
      { name: t(lang, "MATCH_ACTIVE_TIME"), value: `<t:${unix}:R>`, inline: true }
    )
    .setColor(statusColor);
}

function buildMatchLogEmbed({ token, challengerId, opponentId, expiresAt, channelId, messageUrl, color }) {
  const unix = Math.floor(expiresAt / 1000);

  const embed = new EmbedBuilder()
    .setTitle("🧾 MATCH ACTIVE")
    .setDescription("Confronto iniciado e em vigor.")
    .addFields(
      { name: "Token", value: `\`${token}\``, inline: true },
      { name: "Status", value: "✅ Active", inline: true },
      { name: "Expira", value: `<t:${unix}:R>`, inline: true },
      { name: "Players", value: `<@${challengerId}> vs <@${opponentId}>`, inline: false },
      { name: "Canal", value: `<#${channelId}>`, inline: true }
    )
    .setColor(safeColor(color, 0x2ecc71))
    .setTimestamp(Date.now());

  if (messageUrl) embed.addFields({ name: "Link", value: `[Abrir mensagem do confronto](${messageUrl})`, inline: false });

  return embed;
}

// ========================================================
// ✅ Wizard embeds: expired/cancelled
// ========================================================
function buildExpiredEmbed(userId, color) {
  const lang = getUserLang(userId);

  return new EmbedBuilder()
    .setTitle(lang === "en-US" ? "⏳ Time expired" : "⏳ Tempo esgotado")
    .setDescription(
      lang === "en-US"
        ? "The process was cancelled because you took too long."
        : "O processo foi cancelado porque você demorou demais."
    )
    .setColor(safeColor(color, 0xe74c3c));
}

function buildCancelledEmbed(userId, color) {
  const lang = getUserLang(userId);

  return new EmbedBuilder()
    .setTitle(lang === "en-US" ? "✅ Cancelled" : "✅ Cancelado")
    .setDescription(lang === "en-US" ? "The process has been cancelled." : "O processo foi cancelado.")
    .setColor(safeColor(color, 0x2ecc71));
}

// ========================================================
// ✅ NEW: Embeds bonitas do challenger (invite sent/declined)
// - removem texto feio "📩 Convite enviado..."
// ========================================================
function buildInviteSentEmbed({ challengerId, opponentId, lang, color, expiresAt }) {
  const unix = Math.floor(Number(expiresAt || 0) / 1000);

  const title = lang === "en-US" ? "📩 Invite sent" : "📩 Convite enviado";
  const desc =
    lang === "en-US"
      ? `Your invite was sent to <@${opponentId}>.\n\nThe match will only become active if they **accept**.`
      : `Seu convite foi enviado para <@${opponentId}>.\n\nO confronto só entra em vigor quando ele **aceitar**.`;

  const expireName = lang === "en-US" ? "Invite expires" : "Expira";
  const playersName = lang === "en-US" ? "Players" : "Players";

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .addFields(
      { name: playersName, value: `<@${challengerId}> vs <@${opponentId}>`, inline: false },
      { name: expireName, value: `<t:${unix}:R>`, inline: true }
    )
    .setColor(safeColor(color, 0xf1c40f));
}

function buildInviteDeclinedEmbed({ challengerId, opponentId, lang, color }) {
  const title = lang === "en-US" ? "❌ Invite declined" : "❌ Convite recusado";
  const desc =
    lang === "en-US"
      ? `<@${opponentId}> declined your invite.\n\nYou can start a new challenge with **/desafiar**.`
      : `<@${opponentId}> recusou seu convite.\n\nVocê pode iniciar um novo desafio com **/desafiar**.`;

  const playersName = lang === "en-US" ? "Players" : "Players";

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .addFields({ name: playersName, value: `<@${challengerId}> vs <@${opponentId}>`, inline: false })
    .setColor(safeColor(color, 0xe74c3c));
}

module.exports = {
  buildStartEmbed,
  buildStartButtons,
  buildAskOpponentEmbed,
  buildConfirmEmbed,
  buildConfirmButtons,
  buildInviteEmbed,
  buildInviteButtons,
  buildMatchPublicEmbed,
  buildMatchLogEmbed,
  buildExpiredEmbed,
  buildCancelledEmbed,

  // ✅ new exports
  buildInviteSentEmbed,
  buildInviteDeclinedEmbed,
};
