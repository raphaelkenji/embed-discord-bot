const { Events } = require('discord.js');
const { fetchOne } = require('../services/user');
const { fetchMany } = require('../services/url');
const cache = require('../services/cache');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (newMessage.author.bot) return; // oldMessage doesn't return user information?
        if (oldMessage.content === newMessage.content) return;

        const user = await fetchOne(newMessage.author.id);

        if (user.activated) {
            const bot_reply = cache.get(`reply_${newMessage.id}`);
            if (bot_reply) {
                let platforms = cache.get('platforms');
                if (!platforms) {
                    platforms = await fetchMany();
                    cache.set('platforms', platforms);
                }
                
                platforms.forEach(async (platform) => {
                    let regex = platform.regex.replace(/\\\\/g, '\\');
                    const match = newMessage.content.match(regex);
                    if (match) {
                        if (!newMessage.guild) {
                            client.channels.fetch(newMessage.channelId).then(async (channel) => {
                                channel.messages.fetch(bot_reply).then(async (message) => {
                                    await message.edit(match[0].replace(platform.original_url, platform.replacement_url));
                                });
                            });
                        } else {
                            newMessage.channel.messages.fetch(bot_reply).then(async (message) => {
                                await message.edit(match[0].replace(platform.original_url, platform.replacement_url));
                            });
                        }
                    }
                });
            }
        }
    }
};
