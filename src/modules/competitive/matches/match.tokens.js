// src/modules/competitive/matches/match.tokens.js

// ========================================================
// Token generator / validator (v2.0)
//
// Formato:
//   AZ- + 10 caracteres alternados: L N L N ...
// Ex:
//   AZ-H4M5H3L6K8
// ========================================================

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

function randomChar(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateTokenBody() {
  // 10 chars, alternando letra/número
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += i % 2 === 0 ? randomChar(LETTERS) : randomChar(DIGITS);
  }
  return out;
}

function formatFullToken(body10) {
  return `AZ-${String(body10 || "").toUpperCase()}`;
}

function isValidTokenBody(body10) {
  if (!body10 || typeof body10 !== "string") return false;
  if (body10.length !== 10) return false;

  const upper = body10.toUpperCase();
  for (let i = 0; i < 10; i++) {
    const ch = upper[i];
    if (i % 2 === 0) {
      if (!LETTERS.includes(ch)) return false;
    } else {
      if (!DIGITS.includes(ch)) return false;
    }
  }
  return true;
}

function parseTokenInput(input) {
  // usuário pode digitar:
  // - H4M5H3L6K8 (10)
  // - AZ-H4M5H3L6K8
  if (!input) return null;
  const raw = String(input).trim().toUpperCase();

  if (raw.startsWith("AZ-")) {
    const body = raw.slice(3);
    if (!isValidTokenBody(body)) return null;
    return formatFullToken(body);
  }

  // regra do projeto: usuário digita só os 10 chars
  if (!isValidTokenBody(raw)) return null;
  return formatFullToken(raw);
}

module.exports = {
  generateTokenBody,
  formatFullToken,
  isValidTokenBody,
  parseTokenInput,
};
