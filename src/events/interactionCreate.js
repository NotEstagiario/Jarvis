// src/events/interactionCreate.js

// ========================================================
// Evento interactionCreate
// ESTE ARQUIVO NÃO CONTÉM LÓGICA PESADA.
// Ele apenas encaminha para o Router.
// ========================================================

const router = require("../core/interactionRouter/interactionCreate");

module.exports = async (interaction) => {
  try {
    await router(interaction);
  } catch (err) {
    // ✅ FIX DEFINITIVO:
    // 10062 = Unknown interaction (expirou)
    // 40060 = Interaction already acknowledged (reply/defer duplicado)
    const code = err?.code;
    if (code === 10062 || code === 40060) return;

    // se caiu aqui, deixa o erro aparecer (é bug real)
    throw err;
  }
};
