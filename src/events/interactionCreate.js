// src/events/interactionCreate.js

// ========================================================
// Evento interactionCreate
// ESTE ARQUIVO NÃO CONTÉM LÓGICA PESADA.
// Ele apenas encaminha para o Router.
// ========================================================

const router = require("../core/interactionRouter/interactionCreate");

module.exports = async (interaction) => {
  await router(interaction);
};
