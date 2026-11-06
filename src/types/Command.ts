import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

export interface BotCommand {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  ownerOnly?: boolean;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
