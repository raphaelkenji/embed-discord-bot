const { Events } = require('discord.js');
const { fetchOne } = require('../services/user');
const { fetchMany } = require('../services/url');
const cache = require('../services/cache');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const user = await fetchOne(message.author.id);

        if (user.activated) {
            let platforms = cache.get('platforms');
            if (!platforms) {
                platforms = await fetchMany();
                cache.set('platforms', platforms);
            }

            platforms.forEach(async (platform) => {
                let regex = platform.regex.replace(/\\\\/g, '\\');
                const match = message.content.match(regex);
                if (match) {
                    if (!message.guild) {
                        client.channels.fetch(message.channelId).then((channel) => {
                            channel.messages.fetch(message.id).then(async (message) => {
                                const reply = await message.reply(match[0].replace(platform.original_url, platform.replacement_url));
                                cache.set(`reply_${message.id}`, reply.id, 300);
                            });
                        });
                    } else {
                        message.suppressEmbeds(true);
                        const reply = await message.reply(match[0].replace(platform.original_url, platform.replacement_url));
                        cache.set(`reply_${message.id}`, reply.id, 300);
                    }
                }
            });
        }
    }
};
