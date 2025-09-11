import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { UserService } from '../../services';
import { logger } from '../../utils';

export default {
  whitelist: false,
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Toggle embed tracking.')
    .addBooleanOption(option =>
      option.setName('activated')
        .setDescription('Whether your embeds should be tracked or not.')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const userService = new UserService();
      const activated = interaction.options.getBoolean('activated', true);
      
      const user = await userService.findById(interaction.user.id);
      await userService.update(interaction.user.id, { activated });
      
      const statusText = activated ? 'enabled' : 'disabled';
      await interaction.reply({ 
        content: `Embed tracking has been ${statusText}.`, 
        ephemeral: true 
      });
      
      logger.info(`User ${interaction.user.id} ${statusText} embed tracking`);
    } catch (error) {
      logger.error('Error executing track command:', error);
      
      await interaction.reply({ 
        content: 'There was an error processing your request. Please try again later.', 
        ephemeral: true 
      });
    }
  },
};