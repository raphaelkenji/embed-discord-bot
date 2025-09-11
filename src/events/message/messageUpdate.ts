import { Events, Message } from "discord.js";
import { UserService, UrlService } from "../../services";
import { logger } from "../../utils";

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message, newMessage: Message): Promise<void> {
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    try {
      const userService = new UserService();
      const urlService = new UrlService();

      const user = await userService.findById(newMessage.author!.id);

      const cachedReplyId = urlService.getCachedReply(newMessage.id);

      if (cachedReplyId && user.activated) {
        const platforms = await urlService.getPlatforms();

        for (const platform of platforms) {
          const replacementUrl = urlService.processUrlReplacement(
            newMessage.content,
            platform
          );

          if (replacementUrl) {
            try {
              const replyMessage = await newMessage.channel.messages.fetch(
                cachedReplyId
              );
              await replyMessage.edit({
                content: replacementUrl,
                allowedMentions: { repliedUser: false },
              });

              logger.debug(
                `URL replacement updated for user ${newMessage.author!.id}`,
                {
                  originalUrl: platform.original_url,
                  replacementUrl,
                }
              );

              break;
            } catch (error) {
              logger.warn(
                `Failed to edit cached reply message ${cachedReplyId}:`,
                error
              );
              urlService.removeCachedReply(newMessage.id);
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error processing message update event:", error);
    }
  },
};
