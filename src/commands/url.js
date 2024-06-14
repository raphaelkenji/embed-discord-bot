const { SlashCommandBuilder } = require('discord.js');
const { fetchMany, fetchOne, create, update, remove } = require('../services/url');

module.exports = {
    whitelist: true,
    data: new SlashCommandBuilder()
        .setName('url')
        .setDescription('Manage URLs')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List URLs')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a URL')
                .addStringOption(option =>
                    option.setName('original_url')
                        .setDescription('The URL to add')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('regex')
                        .setDescription('The regex to match')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('replacement_url')
                        .setDescription('The URL to replace with')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a URL')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the URL to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update a URL')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the URL to update')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('param')
                        .setDescription('The parameter to update')
                        .setRequired(true)
                        .addChoices(
                            { name: 'original_url', value: 'original_url' },
                            { name: 'regex', value: 'regex' },
                            { name: 'replacement_url', value: 'replacement_url' }
                        )
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The value to update the parameter to')
                        .setRequired(true)
                ),
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'list': {
                const urls = await fetchMany();
                if (!urls.length) {
                    return interaction.reply('No URLs found');
                }
                const response = urls.map(url => `${url.id}: ${url.original_url} -> ${url.replacement_url}`).join('\n');
                return interaction.reply(`\`\`\`${response}\`\`\``);
            }
            case 'add': {
                const original_url = interaction.options.getString('original_url');
                const regex = interaction.options.getString('regex');
                const replacement_url = interaction.options.getString('replacement_url');
                const url = await create({ original_url: original_url, regex: regex, replacement_url: replacement_url });
                return interaction.reply(`Added URL: \`${url.id} (${url.original_url} -> ${url.replacement_url}\`)`);
            }
            case 'remove': {
                const id = interaction.options.getInteger('id');
                const removed = await remove(id);
                return interaction.reply(removed ? `Removed URL` : 'Could not remove URL');
            }
            case 'update': {
                const id = interaction.options.getInteger('id');
                const param = interaction.options.getString('param');
                const value = interaction.options.getString('value');
                const url = await fetchOne(id);
                if (!url) {
                    return interaction.reply('URL not found');
                }
                const updatedUrl = await update(id, { ...url, [param]: value });
                return interaction.reply(`Updated URL: ${updatedUrl.id}`);
            }
            default:
                return interaction.reply('Invalid subcommand');
        }
    }
};
