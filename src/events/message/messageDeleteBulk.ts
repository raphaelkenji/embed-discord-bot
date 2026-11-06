import { Collection, Events, Message, PartialMessage } from 'discord.js';
import { deleteReply, serializeMessage } from '../../services/messageReplies';

export default {
  name: Events.MessageBulkDelete,
  async execute(messages: Collection<string, Message | PartialMessage>): Promise<void> {
    await Promise.all(messages.map(message => serializeMessage(message.id, () => deleteReply(message))));
  },
};
