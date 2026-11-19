import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { CacheService } from '../../../../../core/cache/cache.service';
import { DEFAULT_COLOR_SCHEME } from '../../../constants/shop-settings.constants';
import { SHOP_SETTINGS_CONSTRAINTS } from '../../../constants/shop-settings-constraint.constants';
import { ShopSettings } from '../../../entities/shop-settings.entity';
import { ShopSettingsRepository } from '../../../repositories/shop-settings/shop-settings.repository';
import { ShopSettingsService } from './shop-settings.service';

const SHOP_ID = '98f21967-fce6-4ceb-af61-304913f593a7';

const buildSettings = (overrides: Partial<ShopSettings> = {}): ShopSettings =>
  ({
    shopId: SHOP_ID,
    useUkrposhta: false,
    usePhoneLogin: false,
    useAutomaticPayment: false,
    useOneClickPurchase: false,
    colorScheme: {},
    createdAt: new Date('2026-11-18T10:00:00.000Z'),
    updatedAt: new Date('2026-11-18T10:00:00.000Z'),
    ...overrides,
  }) as ShopSettings;

const buildQueryFailedError = (code: string, constraint: string) =>
  Object.assign(new QueryFailedError('INSERT', [], new Error('db')), {
    code,
    constraint,
  });

describe('ShopSettingsService', () => {
  let service: ShopSettingsService;
  let shopSettingsRepository: ShopSettingsRepository;
  let cacheService: CacheService;

  beforeEach(async () => {
    const shopSettingsRepositoryMock = {
      findByShopId: jest.fn(),
      createDefault: jest.fn(),
      save: jest.fn(async (settings: ShopSettings) => settings),
    };
    const cacheServiceMock = { invalidate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopSettingsService,
        {
          provide: ShopSettingsRepository,
          useValue: shopSettingsRepositoryMock,
        },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<ShopSettingsService>(ShopSettingsService);
    shopSettingsRepository = module.get<ShopSettingsRepository>(
      ShopSettingsRepository,
    );
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getShopSettings', () => {
    it('should return existing settings with the resolved palette', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(
        buildSettings({
          usePhoneLogin: true,
          colorScheme: { accent: '#123456' },
        }),
      );

      const result = await service.getShopSettings(SHOP_ID);

      expect(result.usePhoneLogin).toBe(true);
      expect(result.colorScheme).toEqual({
        ...DEFAULT_COLOR_SCHEME,
        accent: '#123456',
      });
      expect(shopSettingsRepository.createDefault).not.toHaveBeenCalled();
    });

    it('should create default settings on first access', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(null);
      jest
        .mocked(shopSettingsRepository.createDefault)
        .mockResolvedValue(buildSettings());

      const result = await service.getShopSettings(SHOP_ID);

      expect(shopSettingsRepository.createDefault).toHaveBeenCalledWith(
        SHOP_ID,
      );
      expect(result.colorScheme).toEqual(DEFAULT_COLOR_SCHEME);
    });

    it('should throw NotFoundException when the shop does not exist', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(null);
      jest
        .mocked(shopSettingsRepository.createDefault)
        .mockRejectedValue(
          buildQueryFailedError('23503', SHOP_SETTINGS_CONSTRAINTS.SHOP_FK),
        );

      await expect(service.getShopSettings(SHOP_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should rethrow unknown errors', async () => {
      const error = new Error('connection lost');
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(null);
      jest
        .mocked(shopSettingsRepository.createDefault)
        .mockRejectedValue(error);

      await expect(service.getShopSettings(SHOP_ID)).rejects.toBe(error);
    });
  });

  describe('updateShopSettings', () => {
    it('should update flags, merge colors, save and invalidate cache', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(
        buildSettings({
          colorScheme: { accent: '#111111', muted: '#222222' },
        }),
      );

      const result = await service.updateShopSettings(SHOP_ID, {
        useUkrposhta: true,
        usePhoneLogin: true,
        useAutomaticPayment: true,
        useOneClickPurchase: true,
        colorScheme: { accent: null, foreground: '#ABCDEF' },
      });

      expect(shopSettingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          useUkrposhta: true,
          usePhoneLogin: true,
          useAutomaticPayment: true,
          useOneClickPurchase: true,
          colorScheme: { muted: '#222222', foreground: '#abcdef' },
        }),
      );
      expect(cacheService.invalidate).toHaveBeenCalledWith(SHOP_ID);
      expect(result.colorScheme).toEqual({
        ...DEFAULT_COLOR_SCHEME,
        muted: '#222222',
        foreground: '#abcdef',
      });
    });

    it('should leave fields that are not sent unchanged', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(
        buildSettings({
          useUkrposhta: true,
          useOneClickPurchase: true,
          colorScheme: { accent: '#111111' },
        }),
      );

      await service.updateShopSettings(SHOP_ID, { usePhoneLogin: true });

      expect(shopSettingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          useUkrposhta: true,
          usePhoneLogin: true,
          useAutomaticPayment: false,
          useOneClickPurchase: true,
          colorScheme: { accent: '#111111' },
        }),
      );
    });

    it('should not save when the shop does not exist', async () => {
      jest.mocked(shopSettingsRepository.findByShopId).mockResolvedValue(null);
      jest
        .mocked(shopSettingsRepository.createDefault)
        .mockRejectedValue(
          buildQueryFailedError('23503', SHOP_SETTINGS_CONSTRAINTS.SHOP_FK),
        );

      await expect(
        service.updateShopSettings(SHOP_ID, { useUkrposhta: true }),
      ).rejects.toThrow(NotFoundException);
      expect(shopSettingsRepository.save).not.toHaveBeenCalled();
      expect(cacheService.invalidate).not.toHaveBeenCalled();
    });
  });
});
