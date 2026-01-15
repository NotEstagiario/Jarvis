/**
 * src/services/xpService.js
 *
 * =========================================================
 * ✅ Sistema de XP competitivo (OFICIAL)
 * =========================================================
 *
 * 🎮 XP POR RESULTADO DE PARTIDA
 * ✅ Vitória: +10 XP
 * 🤝 Empate: +5 XP
 * ❌ Derrota: -15 XP
 *
 * 📊 MODIFICADOR POR DIFERENÇA DE RANK
 * - Vitória contra rank acima: +50% por rank acima
 * - Vitória contra rank igual: normal
 * - Vitória contra rank abaixo: -50% por rank abaixo
 *
 * Ex:
 * - 10 XP base (vitória)
 *   - 1 rank acima => 15
 *   - 2 ranks acima => 20
 *   - 1 rank abaixo => 5
 *   - 2 ranks abaixo => 1 (mínimo)
 *
 * [IMPORTANTE]
 * - clamp mínimo em vitória: 1 XP
 * - empate não recebe modificador (mantém 5)
 * - derrota mantém -15 sempre (punição padrão)
 */

const { getRankByXp } = require("../domain/ranks");

/**
 * Retorna a "ordem" do rank para calcular diferença.
 * UNRANKED = 0, COBRE = 1 ... DIAMANTE = 6
 */
function getRankIndexByXp(xp) {
  const rank = getRankByXp(xp);
  if (!rank) return 0;
  return rank.index ?? 0;
}

/**
 * Calcula XP da partida para o autor e oponente.
 */
function computeMatchXp({ authorXp, opponentXp, homeScore, awayScore }) {
  // Empate
  if (homeScore === awayScore) {
    return { authorDelta: 5, opponentDelta: 5 };
  }

  const authorWin = homeScore > awayScore;
  const opponentWin = awayScore > homeScore;

  // Base
  let authorDelta = authorWin ? 10 : -15;
  let opponentDelta = opponentWin ? 10 : -15;

  // Modificador só em vitórias
  if (authorWin) {
    const diff = getRankIndexByXp(opponentXp) - getRankIndexByXp(authorXp); // >0 => oponente acima
    if (diff > 0) {
      authorDelta = Math.round(10 * (1 + 0.5 * diff));
    } else if (diff < 0) {
      authorDelta = Math.round(10 * (1 + 0.5 * diff)); // diff negativo
      if (authorDelta < 1) authorDelta = 1;
    }
  }

  if (opponentWin) {
    const diff = getRankIndexByXp(authorXp) - getRankIndexByXp(opponentXp);
    if (diff > 0) {
      opponentDelta = Math.round(10 * (1 + 0.5 * diff));
    } else if (diff < 0) {
      opponentDelta = Math.round(10 * (1 + 0.5 * diff));
      if (opponentDelta < 1) opponentDelta = 1;
    }
  }

  return { authorDelta, opponentDelta };
}

module.exports = { computeMatchXp };
