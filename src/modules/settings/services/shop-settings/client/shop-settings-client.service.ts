import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import {
  SHOP_SETTINGS_CACHE_SEGMENT,
  SHOP_SETTINGS_CACHE_TTL_SECONDS,
} from '../../../constants/shop-settings.constants';
import { ShopSettingsResponse } from '../../../models/shop-settings.models';
import { ShopSettingsService } from '../admin/shop-settings.service';

@Injectable()
export class ShopSettingsClientService {
  constructor(
    private readonly shopSettingsService: ShopSettingsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Read on every storefront page load (theme + feature flags), so it goes
   * through the response cache. Admin updates bump the shop's cache version.
   */
  async getShopSettings(shopId: string): Promise<ShopSettingsResponse> {
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: [SHOP_SETTINGS_CACHE_SEGMENT, shopId],
        ttlSeconds: SHOP_SETTINGS_CACHE_TTL_SECONDS,
      },
      () => this.shopSettingsService.getShopSettings(shopId),
    );
  }
}
