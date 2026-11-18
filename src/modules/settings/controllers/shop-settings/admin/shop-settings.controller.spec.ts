import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { ShopSettingsService } from '../../../services/shop-settings/admin/shop-settings.service';
import { ShopSettingsController } from './shop-settings.controller';

const SHOP_ID = '98f21967-fce6-4ceb-af61-304913f593a7';

describe('ShopSettingsController', () => {
  let controller: ShopSettingsController;
  let shopSettingsService: ShopSettingsService;

  beforeEach(async () => {
    const shopSettingsServiceMock = {
      getShopSettings: jest.fn(),
      updateShopSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopSettingsController],
      providers: [
        { provide: ShopSettingsService, useValue: shopSettingsServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ShopSettingsController>(ShopSettingsController);
    shopSettingsService = module.get<ShopSettingsService>(ShopSettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get shop settings', async () => {
    const response = { shopId: SHOP_ID } as any;
    jest
      .mocked(shopSettingsService.getShopSettings)
      .mockResolvedValue(response);

    await expect(controller.getShopSettings(SHOP_ID)).resolves.toBe(response);
    expect(shopSettingsService.getShopSettings).toHaveBeenCalledWith(SHOP_ID);
  });

  it('should update shop settings', async () => {
    const dto = { useUkrposhta: true, colorScheme: { accent: '#123456' } };
    const response = { shopId: SHOP_ID, useUkrposhta: true } as any;
    jest
      .mocked(shopSettingsService.updateShopSettings)
      .mockResolvedValue(response);

    await expect(controller.updateShopSettings(SHOP_ID, dto)).resolves.toBe(
      response,
    );
    expect(shopSettingsService.updateShopSettings).toHaveBeenCalledWith(
      SHOP_ID,
      dto,
    );
  });
});
