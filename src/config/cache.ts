import NodeCache from 'node-cache';
import { environment } from './environment';

class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: environment.CACHE_TTL,
      checkperiod: environment.CACHE_CHECK_PERIOD,
      useClones: false,
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public del(key: string): number {
    return this.cache.del(key);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const cacheService = CacheService.getInstance();
