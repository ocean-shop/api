import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CacheSettingsService } from '../../services/cache/cache-settings.service';
import { CacheSettingsController } from './cache-settings.controller';

describe('CacheSettingsController', () => {
  let controller: CacheSettingsController;
  let cacheSettingsService: CacheSettingsService;

  beforeEach(async () => {
    const cacheSettingsServiceMock = {
      invalidateAll: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [CacheSettingsController],
      providers: [
        { provide: CacheSettingsService, useValue: cacheSettingsServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<CacheSettingsController>(CacheSettingsController);
    cacheSettingsService =
      module.get<CacheSettingsService>(CacheSettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should clear every cached response', async () => {
    const result = { enabled: true, removedKeys: 12 };
    jest.mocked(cacheSettingsService.invalidateAll).mockResolvedValue(result);

    await expect(controller.invalidateAll()).resolves.toEqual(result);
    expect(cacheSettingsService.invalidateAll).toHaveBeenCalledTimes(1);
  });
});
