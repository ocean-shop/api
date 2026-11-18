import { Test, TestingModule } from '@nestjs/testing';
import { ShopSettingsClientService } from '../../../services/shop-settings/client/shop-settings-client.service';
import { ShopSettingsClientController } from './shop-settings-client.controller';

const SHOP_ID = '98f21967-fce6-4ceb-af61-304913f593a7';

describe('ShopSettingsClientController', () => {
  let controller: ShopSettingsClientController;
  let shopSettingsClientService: ShopSettingsClientService;

  beforeEach(async () => {
    const shopSettingsClientServiceMock = { getShopSettings: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopSettingsClientController],
      providers: [
        {
          provide: ShopSettingsClientService,
          useValue: shopSettingsClientServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ShopSettingsClientController>(
      ShopSettingsClientController,
    );
    shopSettingsClientService = module.get<ShopSettingsClientService>(
      ShopSettingsClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get storefront shop settings', async () => {
    const response = { shopId: SHOP_ID } as any;
    jest
      .mocked(shopSettingsClientService.getShopSettings)
      .mockResolvedValue(response);

    await expect(controller.getShopSettings(SHOP_ID)).resolves.toBe(response);
    expect(shopSettingsClientService.getShopSettings).toHaveBeenCalledWith(
      SHOP_ID,
    );
  });
});
