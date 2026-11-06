import { UrlService } from '../services/UrlService';
import { Url } from '../types';

jest.mock('../config/environment', () => ({ environment: { REGEX_TIMEOUT_MS: 2000 } }));

// Mock dependencies to avoid database and cache connections
jest.mock('../config/database', () => ({
  dbPool: {},
}));

jest.mock('../config/cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    has: jest.fn(),
  },
}));

describe('UrlService.processUrlReplacement', () => {
  let urlService: UrlService;

  beforeEach(() => {
    urlService = new UrlService();
  });

  const makePlatform = (overrides: Partial<Url> = {}): Url => ({
    id: 1,
    original_url: 'https://twitter.com',
    regex: '(https?://)(twitter\\.com|x\\.com)',
    replacement_url: '$1fxtwitter.com',
    ...overrides,
  });

  it('replaces a matching URL', async () => {
    const platform = makePlatform();
    const result = await urlService.processUrlReplacement(
      'Check this out https://twitter.com/user/status/123',
      platform
    );
    expect(result).toBe('Check this out https://fxtwitter.com/user/status/123');
  });

  it('replaces x.com variant', async () => {
    const platform = makePlatform();
    const result = await urlService.processUrlReplacement(
      'https://x.com/user/status/456',
      platform
    );
    expect(result).toBe('https://fxtwitter.com/user/status/456');
  });

  it('returns null when no match', async () => {
    const platform = makePlatform();
    const result = await urlService.processUrlReplacement(
      'Hello, no URLs here!',
      platform
    );
    expect(result).toBeNull();
  });

  it('returns null for unrelated URLs', async () => {
    const platform = makePlatform();
    const result = await urlService.processUrlReplacement(
      'https://google.com/search',
      platform
    );
    expect(result).toBeNull();
  });

  it('handles invalid regex gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const platform = makePlatform({ regex: '[invalid' });
    const result = await urlService.processUrlReplacement(
      'https://twitter.com/user',
      platform
    );
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('works with Instagram replacement', async () => {
    const platform = makePlatform({
      id: 2,
      original_url: 'https://instagram.com',
      regex: '(https?://)(www\\.)?instagram\\.com',
      replacement_url: '$1ddinstagram.com',
    });
    const result = await urlService.processUrlReplacement(
      'https://www.instagram.com/p/abc123',
      platform
    );
    expect(result).toBe('https://ddinstagram.com/p/abc123');
  });
});

describe('replacementLinks', () => {
  const service = new UrlService();
  const platforms: Url[] = [{ id: 1, original_url: 'x.com', regex: 'https://x\\.com/', replacement_url: 'https://vxtwitter.com/' }];

  it('returns only converted links, removes duplicates and leaves prose out', async () => {
    expect(await service.replacementLinks('hello @everyone https://x.com/a https://x.com/a https://x.com/b https://example.com', platforms))
      .toBe('https://vxtwitter.com/a\nhttps://vxtwitter.com/b');
  });

  it('returns no reply for unrelated messages', async () => {
    expect(await service.replacementLinks('hello https://example.com', platforms)).toBe('');
  });

  it('does not exceed the message limit or split a URL', async () => {
    const link = 'https://x.com/' + 'a'.repeat(1990);
    expect(await service.replacementLinks(link, platforms)).toBe('');
  });
});
