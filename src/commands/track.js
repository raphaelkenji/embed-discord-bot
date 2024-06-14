const { SlashCommandBuilder } = require('discord.js');
const { fetchOne, update } = require('../services/user');

module.exports = {
    whitelist: false,
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Toggle embed tracking.')
        .addBooleanOption(option =>
            option.setName('activated')
                .setDescription('Whether your embeds should be tracked or not.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = await fetchOne(interaction.user.id);
        const activated = interaction.options.getBoolean('activated');
        if (!user) {
            await create({ id: interaction.user.id, activated });
            await interaction.reply({ content: `Your account has been registered and embed tracking has been ${activated ? 'enabled' : 'disabled'}.`, ephemeral: true });
        } else {
            await update(interaction.user.id, { activated });
            await interaction.reply({ content: `Embed tracking has been ${activated ? 'enabled' : 'disabled'}.`, ephemeral: true });
        }
    }
};