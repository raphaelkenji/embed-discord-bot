import { Events, Message, PartialMessage } from 'discord.js';
import { serializeMessage, syncReply, deleteReply } from '../../services/messageReplies';

export default {
  name: Events.MessageCreate,
  async execute(message: Message | PartialMessage): Promise<void> {
    return serializeMessage(message.id, () => syncReply(message));
  },
};
