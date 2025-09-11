import { Events, Message } from "discord.js";
import { UserService, UrlService } from "../../services";
import { logger } from "../../utils";

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot) return;

    try {
      const userService = new UserService();
      const urlService = new UrlService();

      const user = await userService.findById(message.author.id);

      if (user.activated) {
        const platforms = await urlService.getPlatforms();

        for (const platform of platforms) {
          const replacementUrl = urlService.processUrlReplacement(
            message.content,
            platform
          );

          if (replacementUrl) {
            if (
              message.guild &&
              message.channel.isTextBased() &&
              "permissionsFor" in message.channel
            ) {
              const permissions = message.channel.permissionsFor(
                message.guild.members.me!
              );
              if (permissions?.has("ManageMessages")) {
                await message.suppressEmbeds(true);
              }
            }

            const reply = await message.reply({
              content: replacementUrl,
              allowedMentions: { repliedUser: false },
            });

            urlService.cacheReply(message.id, reply.id, 300);

            logger.debug(
              `URL replacement applied for user ${message.author.id}`,
              {
                originalUrl: platform.original_url,
                replacementUrl,
              }
            );

            break; // Only process the first matching platform
          }
        }
      }
    } catch (error) {
      logger.error("Error processing message create event:", error);
    }
  },
};
