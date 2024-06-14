const { Client, Collection, GatewayIntentBits, Partials, Events } = require('discord.js');
const fs = require('fs');

require('dotenv').config(
    {
        path: '../.env'
    }
);


const client = new Client(
    {
        intents: [
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Channel,
            Partials.Message,
            Partials.Reaction
        ]
    }
)

client.commands = new Collection();
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`${c.user.tag} has connected.`);
    await client.application.commands.set(commands);
});

client.on(Events.Error, async (error) => {
    console.error('An error occurred:', error);
});

client.login(process.env.BOT_TOKEN);