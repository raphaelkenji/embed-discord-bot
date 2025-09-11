import { DISCORD_CONSTANTS } from "./constants";

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeRegexPattern(pattern: string): string {
  return pattern.replace(/\\\\/g, "\\");
}

export function formatDiscordMessage(content: string): string {
  return truncateText(content, DISCORD_CONSTANTS.MAX_MESSAGE_LENGTH);
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[*_`~|\\]/g, "\\$&");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
