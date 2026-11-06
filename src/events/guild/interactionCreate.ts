import { Events, Interaction } from "discord.js";
import { environment } from "../../config/environment";
import { logger } from "../../utils";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guildId) return;

    const command = interaction.client.commands?.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      if (command.ownerOnly && interaction.user.id !== environment.BOT_OWNER_ID) {
        await interaction.reply({
          content: "Only the bot owner can use this command.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );

      const errorMessage = "There was an error while executing this command!";

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
