import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { UserService } from '../../services';
import { logger } from '../../utils';

export default {
  ownerOnly: false,
  data: new SlashCommandBuilder()
    .setName('track')
    .setContexts(0)
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
      await userService.findById(interaction.user.id);
      await userService.update(interaction.user.id, { activated });

      const statusText = activated ? 'enabled' : 'disabled';
      await interaction.editReply({
        content: `Embed tracking has been ${statusText}.`,
      });

      logger.info(`User ${interaction.user.id} ${statusText} embed tracking`);
    } catch (error) {
      logger.error('Error executing track command:', error);

      await interaction.editReply({
        content: 'There was an error processing your request. Please try again later.',
      });
    }
  },
};
