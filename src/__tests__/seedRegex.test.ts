import fs from 'fs';
import path from 'path';
import { UrlService } from '../services/UrlService';
import { Url } from '../types';

jest.mock('../config/environment', () => ({ environment: { REGEX_TIMEOUT_MS: 2000 } }));
jest.mock('../config/database', () => ({ dbPool: {} }));
jest.mock('../config/cache', () => ({ cacheService: {} }));

const seed = fs.readFileSync(path.join(__dirname, '../../database/init/02_seed.sql'), 'utf8');
const platforms: Url[] = [...seed.matchAll(/\('([^']+)', '([^']+)', '([^']+)'\)/g)]
  .map(([, original_url, regex, replacement_url], index) => ({ id: index + 1, original_url, regex, replacement_url }));
const service = new UrlService();

it('loads the four rules from the actual seed', () => {
  expect(platforms.map(rule => rule.original_url)).toEqual(['x.com', 'twitter.com', 'instagram.com', 'tiktok.com']);
});

it.each([
  ['https://x.com/user/status/123', 'https://vxtwitter.com/user/status/123'],
  ['https://www.x.com/user/status/123?utm_source=test&ref=share', 'https://vxtwitter.com/user/status/123'],
  ['http://twitter.com/user/status/123?source=share', 'https://vxtwitter.com/user/status/123'],
  ['https://X.COM/User/status/123', 'https://vxtwitter.com/User/status/123'],
  ['HTTPS://WWW.TWITTER.COM/User/status/123', 'https://vxtwitter.com/User/status/123'],
  ['https://x.com/i/status/123', 'https://vxtwitter.com/i/status/123'],
  ['https://x.com/user/status/123#fragment', 'https://vxtwitter.com/user/status/123'],
  ['https://x.com/user/status/123/photo/1?source=share#fragment', 'https://vxtwitter.com/user/status/123/photo/1'],
  ['https://x.com/user/status/123/video/2/', 'https://vxtwitter.com/user/status/123/video/2'],
  ['(https://x.com/user/status/123).', 'https://vxtwitter.com/user/status/123'],
  ['https://www.instagram.com/p/ABC_123/?igsh=abc', 'https://ddinstagram.com/p/ABC_123'],
  ['https://instagram.com/reel/ABC-123/?utm_source=test', 'https://ddinstagram.com/reel/ABC-123'],
  ['https://instagram.com/p/ABC_123/#fragment', 'https://ddinstagram.com/p/ABC_123'],
  ['[post](https://instagram.com/p/ABC_123).', 'https://ddinstagram.com/p/ABC_123'],
  ['"https://INSTAGRAM.COM/p/ABC_123/"', 'https://ddinstagram.com/p/ABC_123'],
  ['<https://instagram.com/p/ABC_123/>', 'https://ddinstagram.com/p/ABC_123'],
  ['https://www.tiktok.com/@user.name/video/123?is_from_webapp=1', 'https://vxtiktok.com/@user.name/video/123'],
  ['https://TIKTOK.COM/@User_name/video/123/#fragment', 'https://vxtiktok.com/@User_name/video/123'],
])('converts %s into a complete canonical link', async (input, expected) => {
  await expect(service.replacementLinks(input, platforms)).resolves.toBe(expected);
});

it.each([
  'https://example.com/https://x.com/user/status/123',
  'https://example.com/?next=https://x.com/user/status/123',
  'https://x.com.evil.test/user/status/123',
  'https://evilx.com/user/status/123',
  'https://x.com@evil.test/user/status/123',
  'https://x.com/user/status/123junk',
  'https://x.com/user/status/123/photo/1junk',
  'https://x.com/user/status/123/unrelated/path',
  'https://x.com/invalid-name/status/123',
  'https://twitter.com/user/status/',
  'https://instagram.com/p/ABC%20DEF/',
  'https://instagram.com/p/ABC/extra',
  'https://instagram.com/stories/user/123',
  'https://vm.tiktok.com/ABC123/',
  'https://www.tiktok.com/t/ABC123/',
  'https://tiktok.com/@user/video/123junk',
  'https://tiktok.com.evil.test/@user/video/123',
])('does not convert unsupported or malformed URL %s', async input => {
  await expect(service.replacementLinks(input, platforms)).resolves.toBe('');
});

it('preserves balanced parentheses in custom URL rules', async () => {
  const custom = [{ id: 99, original_url: 'example.com', regex: '^https://example\\.com/', replacement_url: 'https://replacement.example/' }];
  await expect(service.replacementLinks('(https://example.com/a(b)).', custom))
    .resolves.toBe('https://replacement.example/a(b)');
});
