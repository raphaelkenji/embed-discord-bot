export const DISCORD_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_EMBED_TITLE_LENGTH: 256,
  MAX_EMBED_DESCRIPTION_LENGTH: 4096,
  MAX_EMBED_FIELD_NAME_LENGTH: 256,
  MAX_EMBED_FIELD_VALUE_LENGTH: 1024,
  MAX_EMBED_FOOTER_TEXT_LENGTH: 2048,
  MAX_EMBED_AUTHOR_NAME_LENGTH: 256,
} as const;

export const CACHE_KEYS = {
  PLATFORMS: 'platforms',
  USER_PREFIX: 'user_',
  REPLY_PREFIX: 'reply_',
} as const;

export const ERROR_MESSAGES = {
  DATABASE_CONNECTION_FAILED: 'Failed to connect to database',
  USER_NOT_FOUND: 'User not found',
  URL_NOT_FOUND: 'URL configuration not found',
  INVALID_REGEX: 'Invalid regex pattern',
  DISCORD_API_ERROR: 'Discord API error occurred',
} as const;

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  URL_CREATED: 'URL configuration created successfully',
  URL_UPDATED: 'URL configuration updated successfully',
  URL_DELETED: 'URL configuration deleted successfully',
} as const;
