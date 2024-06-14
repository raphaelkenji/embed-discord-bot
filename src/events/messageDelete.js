const { Events } = require('discord.js');
const cache = require('../services/cache');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        try {
            const bot_reply = cache.get(`reply_${message.id}`);
            if (bot_reply) {
                await message.channel.messages.fetch(bot_reply).then(async (message) => {
                    await message.delete();
                });
                cache.del(`reply_${message.id}`);
            }
        } catch (error) {
            console.error(error);
        }
    }
};
