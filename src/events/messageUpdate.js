const { Events } = require('discord.js');
const { fetchOne } = require('../services/user');
const { fetchMany } = require('../services/url');
const cache = require('../services/cache');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (oldMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const user = await fetchOne(message.author.id);

        if (user.activated) {   
            const bot_reply = cache.get(`reply_${oldMessage.id}`);
            if (bot_reply) {
                let platforms = cache.get('platforms');
                if (!platforms) {
                    platforms = await fetchMany();
                    cache.set('platforms', platforms);
                }
                
                platforms.forEach((platform) => {
                    const match = message.content.match(platform.regex);
                    if (match) {
                        if (!message.guild) {
                            client.channels.fetch(message.channelId).then((channel) => {
                                channel.messages.fetch(bot_reply).then((message) => {
                                    message.edit(match[0].replace(platform.original_url, platform.replacement_url));
                                });
                            });
                        } else {
                            const message = oldMessage.channel.messages.fetch(bot_reply);
                            message.edit(match[0].replace(platform.original_url, platform.replacement_url));
                        }
                    }
                });
            }
        }
    }
};
