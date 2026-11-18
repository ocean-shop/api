import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../../../../core/cache/cache.service';
import {
  DEFAULT_COLOR_SCHEME,
  SHOP_SETTINGS_CACHE_SEGMENT,
  SHOP_SETTINGS_CACHE_TTL_SECONDS,
} from '../../../constants/shop-settings.constants';
import { ShopSettingsResponse } from '../../../models/shop-settings.models';
import { ShopSettingsService } from '../admin/shop-settings.service';
import { ShopSettingsClientService } from './shop-settings-client.service';

const SHOP_ID = '98f21967-fce6-4ceb-af61-304913f593a7';

describe('ShopSettingsClientService', () => {
  let service: ShopSettingsClientService;
  let shopSettingsService: ShopSettingsService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const shopSettingsServiceMock = { getShopSettings: jest.fn() };
    const cacheServiceMock = {
      wrap: jest.fn(async (_descriptor, load: () => Promise<unknown>) =>
        load(),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopSettingsClientService,
        { provide: ShopSettingsService, useValue: shopSettingsServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<ShopSettingsClientService>(ShopSettingsClientService);
    shopSettingsService = module.get<ShopSettingsService>(ShopSettingsService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should load shop settings through the shop-scoped cache', async () => {
    const response: ShopSettingsResponse = {
      shopId: SHOP_ID,
      useUkrposhta: true,
      usePhoneLogin: false,
      useAutomaticPayment: false,
      useOneClickPurchase: true,
      colorScheme: { ...DEFAULT_COLOR_SCHEME },
      updatedAt: new Date('2026-11-18T10:00:00.000Z'),
    };
    jest
      .mocked(shopSettingsService.getShopSettings)
      .mockResolvedValue(response);

    const result = await service.getShopSettings(SHOP_ID);

    expect(result).toBe(response);
    expect(cacheService.wrap).toHaveBeenCalledWith(
      {
        scope: SHOP_ID,
        segments: [SHOP_SETTINGS_CACHE_SEGMENT, SHOP_ID],
        ttlSeconds: SHOP_SETTINGS_CACHE_TTL_SECONDS,
      },
      expect.any(Function),
    );
    expect(shopSettingsService.getShopSettings).toHaveBeenCalledWith(SHOP_ID);
  });
});
