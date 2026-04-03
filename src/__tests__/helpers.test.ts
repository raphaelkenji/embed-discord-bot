import {
  truncateText,
  isValidUrl,
  isValidRegex,
  sanitizeRegexPattern,
  formatDiscordMessage,
  escapeMarkdown,
  chunk,
} from '../utils/helpers';

describe('truncateText', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('returns text unchanged if exactly at limit', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates text exceeding limit with ellipsis', () => {
    expect(truncateText('hello world', 8)).toBe('hello...');
  });
});

describe('isValidUrl', () => {
  it('returns true for valid http URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('returns true for URL with path', () => {
    expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
  });

  it('returns false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('isValidRegex', () => {
  it('returns true for valid regex', () => {
    expect(isValidRegex('^https://example\\.com')).toBe(true);
  });

  it('returns true for simple string pattern', () => {
    expect(isValidRegex('hello')).toBe(true);
  });

  it('returns false for invalid regex', () => {
    expect(isValidRegex('[invalid')).toBe(false);
  });
});

describe('sanitizeRegexPattern', () => {
  it('converts double backslashes to single', () => {
    expect(sanitizeRegexPattern('hello\\\\world')).toBe('hello\\world');
  });

  it('leaves single backslashes alone', () => {
    expect(sanitizeRegexPattern('hello\\nworld')).toBe('hello\\nworld');
  });
});

describe('formatDiscordMessage', () => {
  it('returns short messages unchanged', () => {
    expect(formatDiscordMessage('hello')).toBe('hello');
  });

  it('truncates messages exceeding Discord limit', () => {
    const longMessage = 'a'.repeat(2500);
    const result = formatDiscordMessage(longMessage);
    expect(result.length).toBe(2000);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('escapeMarkdown', () => {
  it('escapes markdown characters', () => {
    expect(escapeMarkdown('**bold**')).toBe('\\*\\*bold\\*\\*');
  });

  it('escapes backticks', () => {
    expect(escapeMarkdown('`code`')).toBe('\\`code\\`');
  });

  it('returns plain text unchanged', () => {
    expect(escapeMarkdown('hello world')).toBe('hello world');
  });
});

describe('chunk', () => {
  it('splits array into chunks of given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns single chunk if array is smaller than size', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});
