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
            try {
                let platforms = cache.get('platforms');
                if (!platforms) {
                    platforms = await fetchMany();
                    cache.set('platforms', platforms);
                }

                platforms.forEach(async (platform) => {
                    let regex = platform.regex.replace(/\\\\/g, '\\'); // TODO: Is this the best solution?
                    const match = message.content.match(regex);
                    if (match) {
                        if (message.guild && message.channel.permissionsFor(message.guild.members.me).has('ManageMessages')) {
                            message.suppressEmbeds(true);
                        }
                        const reply = await message.reply(match[0].replace(platform.original_url, platform.replacement_url));
                        cache.set(`reply_${message.id}`, reply.id, 300);
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }
};
