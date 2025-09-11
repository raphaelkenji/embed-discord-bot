import { Events, Message } from "discord.js";
import { UrlService } from "../../services";
import { logger } from "../../utils";

export default {
  name: Events.MessageDelete,
  async execute(message: Message): Promise<void> {
    try {
      const urlService = new UrlService();
      const cachedReplyId = urlService.getCachedReply(message.id);

      if (cachedReplyId) {
        try {
          const replyMessage = await message.channel.messages.fetch(
            cachedReplyId
          );
          await replyMessage.delete();

          logger.debug(
            `Deleted cached reply message ${cachedReplyId} for deleted message ${message.id}`
          );
        } catch (error) {
          logger.warn(
            `Failed to delete cached reply message ${cachedReplyId}:`,
            error
          );
        } finally {
          urlService.removeCachedReply(message.id);
        }
      }
    } catch (error) {
      logger.error("Error processing message delete event:", error);
    }
  },
};
