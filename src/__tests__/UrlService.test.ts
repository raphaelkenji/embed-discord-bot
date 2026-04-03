import { UrlService } from '../services/UrlService';
import { Url } from '../types';

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

  it('replaces a matching URL', () => {
    const platform = makePlatform();
    const result = urlService.processUrlReplacement(
      'Check this out https://twitter.com/user/status/123',
      platform
    );
    expect(result).toBe('Check this out https://fxtwitter.com/user/status/123');
  });

  it('replaces x.com variant', () => {
    const platform = makePlatform();
    const result = urlService.processUrlReplacement(
      'https://x.com/user/status/456',
      platform
    );
    expect(result).toBe('https://fxtwitter.com/user/status/456');
  });

  it('returns null when no match', () => {
    const platform = makePlatform();
    const result = urlService.processUrlReplacement(
      'Hello, no URLs here!',
      platform
    );
    expect(result).toBeNull();
  });

  it('returns null for unrelated URLs', () => {
    const platform = makePlatform();
    const result = urlService.processUrlReplacement(
      'https://google.com/search',
      platform
    );
    expect(result).toBeNull();
  });

  it('handles invalid regex gracefully', () => {
    const platform = makePlatform({ regex: '[invalid' });
    const result = urlService.processUrlReplacement(
      'https://twitter.com/user',
      platform
    );
    expect(result).toBeNull();
  });

  it('works with Instagram replacement', () => {
    const platform = makePlatform({
      id: 2,
      original_url: 'https://instagram.com',
      regex: '(https?://)(www\\.)?instagram\\.com',
      replacement_url: '$1ddinstagram.com',
    });
    const result = urlService.processUrlReplacement(
      'https://www.instagram.com/p/abc123',
      platform
    );
    expect(result).toBe('https://ddinstagram.com/p/abc123');
  });
});
