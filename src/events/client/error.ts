import { Events } from 'discord.js';
import { logger } from '../../utils';

export default {
  name: Events.Error,
  async execute(error: Error): Promise<void> {
    logger.error('Discord client error:', error);
  },
};
