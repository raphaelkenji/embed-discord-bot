import { Events, Client } from 'discord.js';
import { logger } from '../../utils';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>): Promise<void> {
    try {
      await client.application.commands.set(client.commands.map(command => command.data.toJSON()));
      client.commandsReady = true;
      logger.info(`Bot ready as ${client.user.tag}; commands registered globally`);
    } catch (error) {
      logger.error('Failed to register global commands:', error);
      client.destroy();
      process.exit(1);
    }
  },
};
