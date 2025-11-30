import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ConfigServiceKeys } from 'src/common/constants';
import { CacheKeyModule, CacheKeyPrefix } from './caching_factory.enum';

export interface CacheKeyOption {
  prefix?: CacheKeyPrefix;
  uniqueKey: string;
  module?: CacheKeyModule;
  suffix?: string;
  ttl?: number; // in seconds
  value: any;
}

interface CacheKeyGlobalOption {
  key: string;
  value: any;
  ttl?: number;
}

@Injectable()
export class CachingFactory {
  constructor(
    @Inject(ConfigService)
    private configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis, // Inject Redis client
  ) {}

  /**
   * Sets a global cache entry.
   *
   * @param {CacheKeyGlobalOption} payload - The payload containing the key, value, and optional TTL.
   * @return {Promise<void>} A promise that resolves when the cache entry is set.
   */
  async setGlobal(payload: CacheKeyGlobalOption): Promise<void> {
    const { key, ttl = 60 * 60 * 4, value } = payload;
    const serializedValue = JSON.stringify(value);
    if (ttl > 0) {
      await this.redisClient.setex(key, ttl, serializedValue);
    } else {
      await this.redisClient.set(key, serializedValue);
    }
  }

  /**
   * Sets a cache entry.
   *
   * @param {CacheKeyOption} payload - The payload containing the prefix, unique key, suffix, TTL, and value.
   * @return {Promise<void>} A promise that resolves when the cache entry is set.
   */
  async set(payload: CacheKeyOption): Promise<void> {
    const { ttl = 60 * 60 * 4, value } = payload;
    const cacheKey = this.buildCacheKey(payload);
    const serializedValue = JSON.stringify(value);
    if (ttl > 0) {
      await this.redisClient.setex(cacheKey, ttl, serializedValue);
    } else {
      await this.redisClient.set(cacheKey, serializedValue);
    }
  }

  /**
   * Retrieves a value from the cache based on the provided prefix and key.
   *
   * @param {Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>} payload - The payload containing the prefix, unique key, suffix, and module.
   * @return {Promise<any>} The cached value associated with the prefix and key.
   */
  async get(
    payload: Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>,
  ): Promise<any> {
    const cacheKey = this.buildCacheKey(payload);
    const value = await this.redisClient.get(cacheKey);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Resets the cache manager after verifying the provided password.
   *
   * @param {string} password - The password to verify before resetting the cache manager.
   * @throws {ForbiddenException} If the provided password does not match the system password.
   * @return {Promise<void>} A Promise that resolves when the cache manager is reset.
   */
  async reset(): Promise<void> {
    await this.redisClient.flushdb();
  }

  /**
   * Deletes a cache entry based on the provided prefix, suffix, unique key, and module.
   *
   * @param {Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>} payload - The payload containing the prefix, suffix, unique key, and module.
   * @return {Promise<void>} A promise that resolves when the cache entry is deleted.
   */
  async del(
    payload: Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>,
  ): Promise<boolean> {
    const cacheKey = this.buildCacheKey(payload);
    const result = await this.redisClient.del(cacheKey);
    return result > 0;
  }

  private buildCacheKey(
    payload: Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>,
  ) {
    const { prefix, uniqueKey, suffix, module } = payload;
    let cacheKey = uniqueKey;
    if (module) {
      cacheKey = module + ':' + cacheKey;
    }
    if (prefix) {
      cacheKey = prefix + ':' + cacheKey;
    }
    if (suffix) {
      cacheKey = cacheKey + ':' + suffix;
    }
    return cacheKey;
  }

  async zadd(payload: CacheKeyOption, score: number): Promise<void> {
    const cacheKey = this.buildCacheKey(payload);
    await this.redisClient.zadd(cacheKey, score.toString(), payload.value);
  }

  async zrem(payload: CacheKeyOption): Promise<void> {
    const cacheKey = this.buildCacheKey(payload);
    await this.redisClient.zrem(cacheKey, payload.value);
  }

  async zrank(payload: CacheKeyOption): Promise<number | null> {
    const cacheKey = this.buildCacheKey(payload);
    return await this.redisClient.zrank(cacheKey, payload.value);
  }

  async zcard(
    payload: Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>,
  ): Promise<number> {
    const cacheKey = this.buildCacheKey(payload);
    return await this.redisClient.zcard(cacheKey);
  }

  async zrange(
    payload: CacheKeyOption,
    start = 0,
    end = -1,
  ): Promise<string[]> {
    const cacheKey = this.buildCacheKey(payload);
    return await this.redisClient.zrange(cacheKey, start, end);
  }

  async delRedisKey(
    payload: Pick<CacheKeyOption, 'prefix' | 'suffix' | 'uniqueKey' | 'module'>,
  ): Promise<number | null> {
    const cacheKey = this.buildCacheKey(payload);
    return await this.redisClient.del(cacheKey);
  }

  async saddWithoutRaceCondition(payload: CacheKeyOption): Promise<void> {
    const { value } = payload;
    const cacheKey = this.buildCacheKey(payload);
    const redis = this.redisClient;
    try {
      // Start a transaction by watching the "sessions" set
      await redis.watch(cacheKey);

      // Check if the cacheKey already exists in the set
      const cacheKeyExists = await redis.sismember(cacheKey, value);
      if (cacheKeyExists) {
        await redis.unwatch();
        throw new Error(`Value "${value}" already exists in ${cacheKey}`);
      }

      // Start the transaction if the session ID doesn't exist
      const transaction = redis.multi();
      transaction.sadd(cacheKey, value);

      // Execute the transaction atomically
      const result = await transaction.exec();

      if (result === null) {
        // If the transaction failed (due to another client modifying the set in the meantime)
        throw new Error('Transaction failed due to race condition.');
      }
    } catch (error) {
      await redis.unwatch();
      throw error; // Re-throw the error to notify higher-level logic if needed
    }
  }

  async srem(payload: CacheKeyOption): Promise<void> {
    const { value } = payload;
    const cacheKey = this.buildCacheKey(payload);
    const redis = this.redisClient;

    try {
      const result = await redis.srem(cacheKey, value);

      if (result === 0) {
        throw new Error(`Value "${value}" not found in the set.`);
      }
    } catch (error) {
      throw error;
    }
  }

  async sismember(payload: CacheKeyOption): Promise<any> {
    const { value } = payload;
    const cacheKey = this.buildCacheKey(payload);

    try {
      const redis = this.redisClient;
      return await redis.sismember(cacheKey, value);
    } catch (error) {}
  }

  async getSet(
    payload: Pick<
      CacheKeyOption,
      'prefix' | 'suffix' | 'uniqueKey' | 'module' | 'value'
    >,
  ): Promise<any> {
    const cacheKey = this.buildCacheKey(payload);
    const { value } = payload;
    return this.redisClient.getset(cacheKey, value);
  }
}
