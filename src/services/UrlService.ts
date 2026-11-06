import { UrlModel } from '../models';
import { Url, CreateUrlData, UpdateUrlData } from '../types';
import { cacheService } from '../config/cache';
import { dbPool } from '../config/database';
import { CACHE_KEYS } from '../utils/constants';
import { environment } from '../config/environment';
import { runRegexReplacements } from '../utils/regexWorker';
import { sanitizeRegexPattern } from '../utils/helpers';

export class UrlService {
  private urlModel: UrlModel;

  constructor() {
    this.urlModel = new UrlModel(dbPool);
  }

  async findAll(): Promise<Url[]> {
    return this.urlModel.findAll();
  }

  async findById(id: number): Promise<Url | null> {
    return this.urlModel.findById(id);
  }

  async create(urlData: CreateUrlData): Promise<Url> {
    const url = await this.urlModel.create(urlData);
    
    // Refresh platforms cache
    await this.refreshPlatformsCache();
    
    return url;
  }

  async update(id: number, urlData: UpdateUrlData): Promise<Url | null> {
    const url = await this.urlModel.update(id, urlData);
    
    if (url) {
      // Refresh platforms cache
      await this.refreshPlatformsCache();
    }
    
    return url;
  }

  async delete(id: number): Promise<boolean> {
    const deleted = await this.urlModel.delete(id);
    
    if (deleted) {
      // Refresh platforms cache
      await this.refreshPlatformsCache();
    }
    
    return deleted;
  }

  async getPlatforms(): Promise<Url[]> {
    let platforms = cacheService.get<Url[]>(CACHE_KEYS.PLATFORMS);
    
    if (!platforms) {
      platforms = await this.findAll();
      cacheService.set(CACHE_KEYS.PLATFORMS, platforms);
    }
    
    return platforms;
  }

  private async refreshPlatformsCache(): Promise<void> {
    cacheService.del(CACHE_KEYS.PLATFORMS);
  }

  async cacheReply(messageId: string, replyId: string, channelId: string): Promise<void> {
    await dbPool.query(
      'INSERT INTO message_replies (message_id, reply_id, channel_id) VALUES ($1, $2, $3) ON CONFLICT (message_id) DO UPDATE SET reply_id = EXCLUDED.reply_id, channel_id = EXCLUDED.channel_id',
      [messageId, replyId, channelId]
    );
    cacheService.set(`${CACHE_KEYS.REPLY_PREFIX}${messageId}`, replyId);
  }

  async getCachedReply(messageId: string): Promise<string | undefined> {
    const key = `${CACHE_KEYS.REPLY_PREFIX}${messageId}`;
    const cached = cacheService.get<string>(key);
    if (cached) return cached;
    const result = await dbPool.query('SELECT reply_id FROM message_replies WHERE message_id = $1', [messageId]);
    const replyId = result.rows[0]?.reply_id;
    if (replyId) cacheService.set(key, replyId);
    return replyId;
  }

  async removeCachedReply(messageId: string): Promise<void> {
    await dbPool.query('DELETE FROM message_replies WHERE message_id = $1', [messageId]);
    cacheService.del(`${CACHE_KEYS.REPLY_PREFIX}${messageId}`);
  }

  async replacementLinks(content: string, platforms: Url[]): Promise<string> {
    const links = (content.match(/https?:\/\/[^\s<>"'`\u201c\u201d\u2018\u2019]+/gi) ?? []).map(raw => {
      let link = raw.replace(/[.,!?;:]+$/, '');
      const pairs = [['(', ')'], ['[', ']'], ['{', '}']];
      let trimmed = true;
      while (trimmed) {
        trimmed = false;
        for (const [open, close] of pairs) {
          if (link.endsWith(close) && link.split(close).length > link.split(open).length) {
            link = link.slice(0, -1).replace(/[.,!?;:]+$/, '');
            trimmed = true;
          }
        }
      }
      return link.replace(/^https?:\/\/[^/?#]+/i, authority => authority.toLowerCase());
    });
    const results = await runRegexReplacements(links, platforms.map(platform => ({
      regex: sanitizeRegexPattern(platform.regex), replacement_url: platform.replacement_url,
    })), environment.REGEX_TIMEOUT_MS);
    const replacements: string[] = [];
    for (const result of results) {
      if (result && /^https?:\/\/[^\s<>]+$/i.test(result) && !replacements.includes(result) &&
          [...replacements, result].join('\n').length <= 2000) {
        replacements.push(result);
      }
    }
    return replacements.join('\n');
  }

  async processUrlReplacement(content: string, platform: Url): Promise<string | null> {
    try {
      const [result] = await runRegexReplacements([content], [{
        regex: sanitizeRegexPattern(platform.regex), replacement_url: platform.replacement_url,
      }], environment.REGEX_TIMEOUT_MS);
      return result;
    } catch (error) {
      console.error(`Error processing URL replacement for platform ${platform.id}:`, error);
      return null;
    }
  }
}
