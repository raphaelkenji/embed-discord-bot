import { Events, Client } from 'discord.js';
import { logger } from '../../utils';
import { database } from '../../config/database';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>): Promise<void> {
    try {
      logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
      logger.info(`Serving ${client.guilds.cache.size} guilds`);
      
      // Connect to database
      await database.connect();
      
      // Register slash commands globally
      if (client.application) {
        // This would be where you register commands if you have any
        logger.info('Application commands ready');
      }
      
      logger.info('Bot initialization completed successfully');
    } catch (error) {
      logger.error('Error during bot initialization:', error);
      process.exit(1);
    }
  },
};
