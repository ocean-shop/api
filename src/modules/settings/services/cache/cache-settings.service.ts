import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  CacheInvalidationResult,
  CacheService,
} from '../../../../core/cache/cache.service';

@Injectable()
export class CacheSettingsService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Clears every cached response across all shops. Redis failures surface as
   * 503 instead of being swallowed: an operator who clears the cache needs to
   * know whether the responses they are about to check are actually fresh.
   */
  async invalidateAll(): Promise<CacheInvalidationResult> {
    try {
      return await this.cacheService.invalidateAll();
    } catch (error) {
      throw new ServiceUnavailableException(
        `Не вдалося очистити кеш: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
