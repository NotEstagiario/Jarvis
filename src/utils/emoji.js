// src/utils/emoji.js

// ========================================================
// Emoji Helpers (GLOBAL)
//
// Objetivo:
// - Evitar DiscordAPIError 50035 (Invalid Form Body)
// - Garantir que emojis enviados em setEmoji são válidos
//
// Aceita:
// - unicode emoji ("⚽", "🔥")
// - custom emoji "<:name:id>" ou "<a:name:id>"
// - string vazia/null => retorna null
// ========================================================

function isUnicodeEmoji(str) {
  if (!str) return false;
  const s = String(str).trim();
  if (!s) return false;

  // Unicode emoji geralmente ocupa 1-4 chars (mas pode variar).
  // Aqui usamos validação permissiva:
  // se não contém "<:" e contém algum caractere não-ascii comum em emoji.
  if (s.includes("<:") || s.includes("<a:")) return false;

  // Se tem pelo menos um codepoint fora do ASCII, tratamos como unicode emoji.
  return /[^\x00-\x7F]/.test(s);
}

function isCustomEmoji(str) {
  if (!str) return false;
  const s = String(str).trim();
  return /^<a?:[a-zA-Z0-9_]{2,32}:\d{10,30}>$/.test(s);
}

/**
 * sanitizeEmoji
 * - retorna null se inválido
 * - retorna string sanitizada se válido
 */
function sanitizeEmoji(emoji) {
  if (!emoji) return null;

  const s = String(emoji).trim();
  if (!s) return null;

  if (isCustomEmoji(s)) return s;
  if (isUnicodeEmoji(s)) return s;

  return null;
}

/**
 * safeSetEmoji(buttonOrOptionBuilder, emoji)
 * - aplica emoji apenas se válido
 * - evita crash do Discord
 */
function safeSetEmoji(builder, emoji) {
  const safe = sanitizeEmoji(emoji);
  if (!safe) return builder;

  try {
    builder.setEmoji(safe);
  } catch {
    // ignora, não quebra a interação
  }

  return builder;
}

module.exports = {
  sanitizeEmoji,
  safeSetEmoji,
};
