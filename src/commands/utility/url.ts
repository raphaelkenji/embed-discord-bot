import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { UrlService } from "../../services";
import { logger, isValidUrl, isValidRegex } from "../../utils";

export default {
  whitelist: true,
  data: new SlashCommandBuilder()
    .setName("url")
    .setDescription("Manage URLs")
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List URLs")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a URL")
        .addStringOption((option) =>
          option
            .setName("original_url")
            .setDescription("The URL to add")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("regex")
            .setDescription("The regex to match")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("replacement_url")
            .setDescription("The URL to replace with")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a URL")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the URL to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update a URL")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the URL to update")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("param")
            .setDescription("The parameter to update")
            .setRequired(true)
            .addChoices(
              { name: "original_url", value: "original_url" },
              { name: "regex", value: "regex" },
              { name: "replacement_url", value: "replacement_url" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("The value to update the parameter to")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const urlService = new UrlService();
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "list": {
          const urls = await urlService.findAll();
          if (!urls.length) {
            await interaction.reply("No URLs found");
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle("URL Configurations")
            .setColor(0x0099ff)
            .setTimestamp();

          const urlList = urls
            .map(
              (url) =>
                `**ID:** ${url.id}\n**Original:** ${url.original_url}\n**Replacement:** ${url.replacement_url}\n**Regex:** \`${url.regex}\``
            )
            .join("\n\n");

          embed.setDescription(urlList);

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "add": {
          const originalUrl = interaction.options.getString(
            "original_url",
            true
          );
          const regex = interaction.options.getString("regex", true);
          const replacementUrl = interaction.options.getString(
            "replacement_url",
            true
          );

          if (!isValidUrl(originalUrl)) {
            await interaction.reply({
              content: "Invalid original URL format.",
              ephemeral: true,
            });
            return;
          }
          if (!isValidUrl(replacementUrl)) {
            await interaction.reply({
              content: "Invalid replacement URL format.",
              ephemeral: true,
            });
            return;
          }
          if (!isValidRegex(regex)) {
            await interaction.reply({
              content: "Invalid regex pattern.",
              ephemeral: true,
            });
            return;
          }

          const url = await urlService.create({
            original_url: originalUrl,
            regex: regex,
            replacement_url: replacementUrl,
          });

          const embed = new EmbedBuilder()
            .setTitle("URL Configuration Added")
            .setColor(0x00ff00)
            .addFields(
              { name: "ID", value: url.id.toString(), inline: true },
              { name: "Original URL", value: url.original_url, inline: false },
              {
                name: "Replacement URL",
                value: url.replacement_url,
                inline: false,
              },
              { name: "Regex", value: `\`${url.regex}\``, inline: false }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          logger.info(`URL configuration added by ${interaction.user.id}:`, {
            urlId: url.id,
          });
          break;
        }

        case "remove": {
          const id = interaction.options.getInteger("id", true);
          const removed = await urlService.delete(id);

          if (removed) {
            await interaction.reply(
              `✅ URL configuration with ID ${id} has been removed.`
            );
            logger.info(
              `URL configuration ${id} removed by ${interaction.user.id}`
            );
          } else {
            await interaction.reply({
              content: "URL configuration not found or could not be removed.",
              ephemeral: true,
            });
          }
          break;
        }

        case "update": {
          const id = interaction.options.getInteger("id", true);
          const param = interaction.options.getString("param", true) as
            | "original_url"
            | "regex"
            | "replacement_url";
          const value = interaction.options.getString("value", true);

          // Validate input based on parameter
          if (param === "original_url" || param === "replacement_url") {
            if (!isValidUrl(value)) {
              await interaction.reply({
                content: "Invalid URL format.",
                ephemeral: true,
              });
              return;
            }
          } else if (param === "regex") {
            if (!isValidRegex(value)) {
              await interaction.reply({
                content: "Invalid regex pattern.",
                ephemeral: true,
              });
              return;
            }
          }

          const existingUrl = await urlService.findById(id);
          if (!existingUrl) {
            await interaction.reply({
              content: "URL configuration not found.",
              ephemeral: true,
            });
            return;
          }

          const updatedUrl = await urlService.update(id, { [param]: value });

          if (updatedUrl) {
            const embed = new EmbedBuilder()
              .setTitle("URL Configuration Updated")
              .setColor(0xffff00)
              .addFields(
                { name: "ID", value: updatedUrl.id.toString(), inline: true },
                { name: "Updated Parameter", value: param, inline: true },
                { name: "New Value", value: value, inline: false }
              )
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            logger.info(
              `URL configuration ${id} updated by ${interaction.user.id}:`,
              { param, value }
            );
          } else {
            await interaction.reply({
              content: "Failed to update URL configuration.",
              ephemeral: true,
            });
          }
          break;
        }

        default:
          await interaction.reply({
            content: "Invalid subcommand.",
            ephemeral: true,
          });
          break;
      }
    } catch (error) {
      logger.error("Error executing URL command:", error);

      if (!interaction.replied) {
        await interaction.reply({
          content:
            "There was an error processing your request. Please try again later.",
          ephemeral: true,
        });
      }
    }
  },
};
