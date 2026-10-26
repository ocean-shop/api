import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../../../core/cache/cache.service';
import { CacheSettingsService } from './cache-settings.service';

describe('CacheSettingsService', () => {
  let service: CacheSettingsService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const cacheServiceMock = {
      invalidateAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheSettingsService,
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<CacheSettingsService>(CacheSettingsService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should report how many keys the sweep removed', async () => {
    jest
      .mocked(cacheService.invalidateAll)
      .mockResolvedValue({ enabled: true, removedKeys: 42 });

    await expect(service.invalidateAll()).resolves.toEqual({
      enabled: true,
      removedKeys: 42,
    });
  });

  it('should report a disabled cache instead of failing', async () => {
    jest
      .mocked(cacheService.invalidateAll)
      .mockResolvedValue({ enabled: false, removedKeys: 0 });

    await expect(service.invalidateAll()).resolves.toEqual({
      enabled: false,
      removedKeys: 0,
    });
  });

  it('should fail loudly when the sweep cannot reach redis', async () => {
    jest
      .mocked(cacheService.invalidateAll)
      .mockRejectedValue(new Error('ECONNRESET'));

    await expect(service.invalidateAll()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
