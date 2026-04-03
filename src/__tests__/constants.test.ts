import { DISCORD_CONSTANTS, CACHE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

describe('DISCORD_CONSTANTS', () => {
  it('has correct max message length', () => {
    expect(DISCORD_CONSTANTS.MAX_MESSAGE_LENGTH).toBe(2000);
  });

  it('has correct max embed title length', () => {
    expect(DISCORD_CONSTANTS.MAX_EMBED_TITLE_LENGTH).toBe(256);
  });

  it('has correct max embed description length', () => {
    expect(DISCORD_CONSTANTS.MAX_EMBED_DESCRIPTION_LENGTH).toBe(4096);
  });
});

describe('CACHE_KEYS', () => {
  it('has expected cache key values', () => {
    expect(CACHE_KEYS.PLATFORMS).toBe('platforms');
    expect(CACHE_KEYS.USER_PREFIX).toBe('user_');
    expect(CACHE_KEYS.REPLY_PREFIX).toBe('reply_');
  });
});

describe('ERROR_MESSAGES', () => {
  it('has all required error messages', () => {
    expect(ERROR_MESSAGES.DATABASE_CONNECTION_FAILED).toBeDefined();
    expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
    expect(ERROR_MESSAGES.URL_NOT_FOUND).toBeDefined();
    expect(ERROR_MESSAGES.INVALID_REGEX).toBeDefined();
    expect(ERROR_MESSAGES.DISCORD_API_ERROR).toBeDefined();
  });
});

describe('SUCCESS_MESSAGES', () => {
  it('has all required success messages', () => {
    expect(SUCCESS_MESSAGES.USER_CREATED).toBeDefined();
    expect(SUCCESS_MESSAGES.USER_UPDATED).toBeDefined();
    expect(SUCCESS_MESSAGES.URL_CREATED).toBeDefined();
    expect(SUCCESS_MESSAGES.URL_UPDATED).toBeDefined();
    expect(SUCCESS_MESSAGES.URL_DELETED).toBeDefined();
  });
});
