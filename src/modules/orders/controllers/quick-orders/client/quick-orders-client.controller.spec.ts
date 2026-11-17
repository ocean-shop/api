import { Test, TestingModule } from '@nestjs/testing';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrdersClientService } from '../../../services/quick-orders/client/quick-orders-client.service';
import { QuickOrdersClientController } from './quick-orders-client.controller';

describe('QuickOrdersClientController', () => {
  let controller: QuickOrdersClientController;
  let quickOrdersClientService: QuickOrdersClientService;

  beforeEach(async () => {
    const quickOrdersClientServiceMock = {
      createQuickOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickOrdersClientController],
      providers: [
        {
          provide: QuickOrdersClientService,
          useValue: quickOrdersClientServiceMock,
        },
      ],
    }).compile();

    controller = module.get<QuickOrdersClientController>(
      QuickOrdersClientController,
    );
    quickOrdersClientService = module.get<QuickOrdersClientService>(
      QuickOrdersClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create quick order', async () => {
    const dto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      productId: '0b3e2a52-2c1d-4c1f-9f5f-9b8a1d6b0c11',
      name: 'Олена',
      phone: '+380991234567',
    };
    const quickOrder = { id: 'quick-order-id', ...dto } as QuickOrder;
    jest
      .mocked(quickOrdersClientService.createQuickOrder)
      .mockResolvedValue(quickOrder);

    const result = await controller.createQuickOrder(dto);

    expect(quickOrdersClientService.createQuickOrder).toHaveBeenCalledWith(dto);
    expect(result).toBe(quickOrder);
  });
});
