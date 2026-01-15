/**
 * src/utils/tokenUtils.js
 *
 * Generates human-friendly tokens like IE-7H2KQ9.
 * [CRITICAL] Token is used by staff to identify matches. Do not change format casually.
 */

function randomChars(len) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

function generateMatchToken() {
  return `IE-${randomChars(6)}`;
}

module.exports = { generateMatchToken };
