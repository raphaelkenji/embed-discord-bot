import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import fs from "fs";
import { createServer, Server } from "http";
import path from "path";
import { environment } from "./config/environment";
import { database } from "./config/database";
import { logger } from "./utils";
import { BotCommand } from "./types";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, BotCommand>;
    commandsReady?: boolean;
  }
}

class DiscordBot {
  private client: Client;
  private healthServer?: Server;
  private stopping = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
    });

    this.client.commands = new Collection<string, BotCommand>();
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const commandFiles = fs
        .readdirSync(folderPath)
        .filter(
          (file) =>
            (file.endsWith(".ts") || file.endsWith(".js")) &&
            !file.endsWith(".d.ts")
        );

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        try {
          const command = await import(filePath);
          const commandData = command.default || command;

          if ("data" in commandData && "execute" in commandData) {
            this.client.commands.set(commandData.data.name, commandData);
            logger.info(`Loaded command: ${commandData.data.name}`);
          } else {
            logger.warn(
              `Command ${file} is missing required "data" or "execute" property`
            );
          }
        } catch (error) {
          logger.error(`Error loading command ${file}:`, error);
        }
      }
    }
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, "events");
    const eventFolders = fs.readdirSync(eventsPath);

    for (const folder of eventFolders) {
      const folderPath = path.join(eventsPath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const eventFiles = fs
        .readdirSync(folderPath)
        .filter(
          (file) =>
            (file.endsWith(".ts") || file.endsWith(".js")) &&
            !file.endsWith(".d.ts")
        );

      for (const file of eventFiles) {
        const filePath = path.join(folderPath, file);
        try {
          const event = await import(filePath);
          const eventData = event.default || event;

          if ("name" in eventData && "execute" in eventData) {
            if (eventData.once) {
              this.client.once(eventData.name, (...args: any[]) =>
                Promise.resolve().then(() => eventData.execute(...args)).catch(error => logger.error(`Event ${eventData.name} failed:`, error))
              );
            } else {
              this.client.on(eventData.name, (...args: any[]) =>
                Promise.resolve().then(() => eventData.execute(...args)).catch(error => logger.error(`Event ${eventData.name} failed:`, error))
              );
            }
            logger.info(`Loaded event: ${eventData.name}`);
          } else {
            logger.warn(
              `Event ${file} is missing required "name" or "execute" property`
            );
          }
        } catch (error) {
          logger.error(`Error loading event ${file}:`, error);
        }
      }
    }
  }

  private setupGlobalErrorHandlers(): void {
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("SIGINT", () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      this.shutdown();
    });

    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    try {
      logger.info("Starting shutdown process...");

      if (this.stopping) return;
      this.stopping = true;
      this.healthServer?.close();
      const deadline = setTimeout(() => process.exit(1), 25000);
      deadline.unref();
      if (this.client) {
        this.client.destroy();
        logger.info("Discord client destroyed");
      }

      const { database } = await import("./config/database");
      await database.disconnect();

      logger.info("Shutdown completed successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      logger.info("Starting Discord bot...");

      this.setupGlobalErrorHandlers();
      await this.loadCommands();
      await this.loadEvents();
      await database.connect();
      const schemaClient = await database.getPool().connect();
      try {
        await schemaClient.query('BEGIN');
        await schemaClient.query(fs.readFileSync(path.join(__dirname, '../database/init/01_schema.sql'), 'utf8'));
        await schemaClient.query('COMMIT');
      } catch (error) {
        await schemaClient.query('ROLLBACK');
        throw error;
      } finally {
        schemaClient.release();
      }
      this.healthServer = createServer(async (_request, response) => {
        try {
          if (!this.client.isReady() || !this.client.commandsReady || this.stopping) throw new Error('Discord unavailable');
          await database.getPool().query('SELECT 1');
          response.writeHead(200).end('ready');
        } catch {
          response.writeHead(503).end('unavailable');
        }
      });
      this.healthServer.on('error', error => { logger.error('Health server failed:', error); process.exit(1); });
      this.healthServer.listen(8080, '127.0.0.1');

      await this.client.login(environment.BOT_TOKEN);
    } catch (error) {
      logger.error("Failed to start bot:", error);
      process.exit(1);
    }
  }
}

const bot = new DiscordBot();
bot.start().catch((error) => {
  logger.error("Failed to start bot:", error);
  process.exit(1);
});
