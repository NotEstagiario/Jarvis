/**
 * src/index.js
 *
 * Bot entrypoint.
 */

require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { loadCommands } = require("./loader/commandLoader");
const { loadEvents } = require("./loader/eventLoader");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection(loadCommands());

loadEvents(client);

client.login(process.env.DISCORD_TOKEN);
