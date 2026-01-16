// src/core/logger.js

// ========================================================
// Logger do Jarvis
// Objetivo: padronizar logs e facilitar debugging.
// ========================================================

function stamp() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

function info(msg) {
  console.log(`[${stamp()}] [INFO] ${msg}`);
}

function warn(msg) {
  console.warn(`[${stamp()}] [WARN] ${msg}`);
}

function error(msg, err) {
  console.error(`[${stamp()}] [ERROR] ${msg}`);
  if (err) console.error(err);
}

module.exports = {
  info,
  warn,
  error,
};
