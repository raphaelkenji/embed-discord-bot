import { Events, Message, PartialMessage } from 'discord.js';
import { serializeMessage, syncReply, deleteReply } from '../../services/messageReplies';

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message | PartialMessage, message: Message | PartialMessage): Promise<void> {
    if (!message.partial && oldMessage.content === message.content) return;
    return serializeMessage(message.id, () => syncReply(message));
  },
};
