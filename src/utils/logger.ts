export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  public error(message: string, error?: Error | any): void {
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
    console.error(formattedMessage);
  }

  public warn(message: string, data?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(formattedMessage);
  }

  public info(message: string, data?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, data);
    console.log(formattedMessage);
  }

  public debug(message: string, data?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, data);
    console.log(formattedMessage);
  }
}

export const logger = Logger.getInstance();