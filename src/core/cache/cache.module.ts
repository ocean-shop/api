import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_CLIENT } from './constants/cache.constants';
import { isCacheEnabled } from './helpers/cache.helpers';

const cacheClientProvider: Provider = {
  provide: CACHE_CLIENT,
  useFactory: (configService: ConfigService): Redis => {
    const logger = new Logger('CacheClient');
    const client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      // A cache read must never sit in a queue waiting for a dead connection:
      // fail immediately so CacheService can fall back to Postgres.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    let outageReported = false;

    // ioredis turns an unhandled 'error' event into a process crash, so the
    // listener is required even though reconnection is automatic.
    client.on('error', (error: Error) => {
      if (outageReported) {
        return;
      }

      outageReported = true;
      logger.warn(`Redis cache unavailable: ${error.message}`);
    });

    client.on('ready', () => {
      outageReported = false;
    });

    return client;
  },
  inject: [ConfigService],
};

@Module({})
export class CacheModule {
  /**
   * Registers the Redis connection only when caching is enabled, mirroring
   * `QueueModule`. `CacheService` is always provided: without a client it
   * simply passes every call through to the loader.
   */
  static register(): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: isCacheEnabled()
        ? [cacheClientProvider, CacheService]
        : [CacheService],
      exports: [CacheService],
    };
  }
}
