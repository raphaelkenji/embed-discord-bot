const { Events } = require('discord.js');
const { fetchOne } = require('../services/user');

module.exports = {
    name: Events.InteractionCreate,
    async execute (interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        const user = await fetchOne(interaction.user.id);

        if (command.whitelist) {
            if (user.id !== process.env.BOT_OWNER_ID) {
                return await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
            }
        }

        if (!command) {
            console.error(`Command ${interaction.commandName} not found`);
            return await interaction.reply({ content: 'Unable to find command!', ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error while executing command!', ephemeral: true });
        }
    },
};