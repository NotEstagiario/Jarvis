/**
 * src/loader/eventLoader.js
 *
 * Loads events from src/events.
 */

const fs = require("node:fs");
const path = require("node:path");

function loadEvents(client) {
  const eventsPath = path.join(__dirname, "..", "events");
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
    const event = require(path.join(eventsPath, file));
    if (!event?.name || !event.execute) continue;
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

module.exports = { loadEvents };
