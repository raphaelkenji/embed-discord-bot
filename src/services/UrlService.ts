import { UrlModel } from '../models';
import { Url, CreateUrlData, UpdateUrlData } from '../types';
import { cacheService } from '../config/cache';
import { dbPool } from '../config/database';

export class UrlService {
  private urlModel: UrlModel;
  private readonly PLATFORMS_CACHE_KEY = 'platforms';
  private readonly REPLY_CACHE_PREFIX = 'reply_';

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
    let platforms = cacheService.get<Url[]>(this.PLATFORMS_CACHE_KEY);
    
    if (!platforms) {
      platforms = await this.findAll();
      cacheService.set(this.PLATFORMS_CACHE_KEY, platforms);
    }
    
    return platforms;
  }

  private async refreshPlatformsCache(): Promise<void> {
    const platforms = await this.findAll();
    cacheService.set(this.PLATFORMS_CACHE_KEY, platforms);
  }

  cacheReply(messageId: string, replyId: string, ttl = 300): void {
    cacheService.set(`${this.REPLY_CACHE_PREFIX}${messageId}`, replyId, ttl);
  }

  getCachedReply(messageId: string): string | undefined {
    return cacheService.get<string>(`${this.REPLY_CACHE_PREFIX}${messageId}`);
  }

  removeCachedReply(messageId: string): void {
    cacheService.del(`${this.REPLY_CACHE_PREFIX}${messageId}`);
  }

  processUrlReplacement(content: string, platform: Url): string | null {
    try {
      // Clean the regex pattern
      const regexPattern = platform.regex.replace(/\\\\/g, '\\');
      const regex = new RegExp(regexPattern);
      
      // Use replace with the regex and replacement pattern
      const result = content.replace(regex, platform.replacement_url);
      
      // Return the result only if it's different from the original
      if (result !== content) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error(`Error processing URL replacement for platform ${platform.id}:`, error);
      return null;
    }
  }
}
