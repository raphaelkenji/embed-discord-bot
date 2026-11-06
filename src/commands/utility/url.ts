import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { UrlService } from "../../services";
import { logger, isValidUrl, isValidRegex, truncateText } from "../../utils";

export default {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName("url")
    .setDescription("Manage URLs")
    .setContexts(0)
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List URLs")
        .addIntegerOption(option => option.setName("page").setDescription("Page number").setMinValue(1))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a URL")
        .addStringOption((option) =>
          option
            .setName("original_url").setMaxLength(500)
            .setDescription("The URL to add")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("regex").setMaxLength(1000)
            .setDescription("The regex to match")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("replacement_url").setMaxLength(500)
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
            .setName("value").setMaxLength(1000)
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
            await interaction.editReply("No URLs found");
            return;
          }

          const pageSize = 4;
          const pages: EmbedBuilder[] = [];

          for (let start = 0; start < urls.length; start += pageSize) {
            const pageUrls = urls.slice(start, start + pageSize);
            const pageNumber = Math.floor(start / pageSize) + 1;
            const pageCount = Math.ceil(urls.length / pageSize);
            const description = pageUrls
              .map((url) =>
                truncateText(
                  `**ID:** ${url.id}\n**Original:** ${url.original_url}\n**Replacement:** ${url.replacement_url}\n**Regex:** \`${url.regex}\``,
                  950
                )
              )
              .join("\n\n");

            pages.push(
              new EmbedBuilder()
                .setTitle(`URL Configurations (${pageNumber}/${pageCount})`)
                .setColor(0x0099ff)
                .setDescription(description)
                .setTimestamp()
            );
          }

          const page = interaction.options.getInteger("page") ?? 1;
          if (page > pages.length) {
            await interaction.editReply(`Page must be between 1 and ${pages.length}.`);
          } else {
            await interaction.editReply({ embeds: [pages[page - 1]] });
          }
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
            await interaction.editReply({
              content: "Invalid original URL format.",
            });
            return;
          }
          if (!isValidUrl(replacementUrl)) {
            await interaction.editReply({
              content: "Invalid replacement URL format.",
            });
            return;
          }
          if (!isValidRegex(regex)) {
            await interaction.editReply({
              content: "Invalid regex pattern.",
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

          await interaction.editReply({ embeds: [embed] });
          logger.info(`URL configuration added by ${interaction.user.id}:`, {
            urlId: url.id,
          });
          break;
        }

        case "remove": {
          const id = interaction.options.getInteger("id", true);
          const removed = await urlService.delete(id);

          if (removed) {
            await interaction.editReply(
              `✅ URL configuration with ID ${id} has been removed.`
            );
            logger.info(
              `URL configuration ${id} removed by ${interaction.user.id}`
            );
          } else {
            await interaction.editReply({
              content: "URL configuration not found or could not be removed.",
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
            if (value.length > 500 || !isValidUrl(value)) {
              await interaction.editReply({
                content: "Invalid URL format.",

              });
              return;
            }
          } else if (param === "regex") {
            if (!isValidRegex(value)) {
              await interaction.editReply({
                content: "Invalid regex pattern.",

              });
              return;
            }
          }

          const existingUrl = await urlService.findById(id);
          if (!existingUrl) {
            await interaction.editReply({
              content: "URL configuration not found.",
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

            await interaction.editReply({ embeds: [embed] });
            logger.info(
              `URL configuration ${id} updated by ${interaction.user.id}:`,
              { param, value }
            );
          } else {
            await interaction.editReply({
              content: "Failed to update URL configuration.",
            });
          }
          break;
        }

        default:
          await interaction.editReply({
            content: "Invalid subcommand.",

          });
          break;
      }
    } catch (error) {
      logger.error("Error executing URL command:", error);

      if (interaction.deferred || !interaction.replied) {
        await interaction.editReply({
          content:
            "There was an error processing your request. Please try again later.",

        });
      }
    }
  },
};
