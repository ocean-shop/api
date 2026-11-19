import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QUICK_ORDER_MESSAGES } from '../../../constants/quick-order-messages.constants';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderClientRepository } from '../../../repositories/quick-order/client/quick-order-client.repository';
import { QuickOrdersClientService } from './quick-orders-client.service';

describe('QuickOrdersClientService', () => {
  let service: QuickOrdersClientService;
  let quickOrderClientRepository: QuickOrderClientRepository;

  const dto = {
    shopId: 'shop-id',
    productId: 'product-id',
    name: 'Олена',
    phone: '+380991234567',
  };

  beforeEach(async () => {
    const quickOrderClientRepositoryMock = {
      existsProductInShop: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrdersClientService,
        {
          provide: QuickOrderClientRepository,
          useValue: quickOrderClientRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<QuickOrdersClientService>(QuickOrdersClientService);
    quickOrderClientRepository = module.get<QuickOrderClientRepository>(
      QuickOrderClientRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new quick order for a product of the shop', async () => {
    const entity = { ...dto, status: QuickOrderStatus.NEW } as QuickOrder;
    const saved = { id: 'quick-order-id', ...entity };
    jest
      .mocked(quickOrderClientRepository.existsProductInShop)
      .mockResolvedValue(true);
    jest.mocked(quickOrderClientRepository.create).mockReturnValue(entity);
    jest.mocked(quickOrderClientRepository.save).mockResolvedValue(saved);

    const result = await service.createQuickOrder(dto);

    expect(quickOrderClientRepository.existsProductInShop).toHaveBeenCalledWith(
      'shop-id',
      'product-id',
    );
    expect(quickOrderClientRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      productId: 'product-id',
      name: 'Олена',
      phone: '+380991234567',
      status: QuickOrderStatus.NEW,
    });
    expect(quickOrderClientRepository.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(saved);
  });

  it('should reject a product that is not in the shop', async () => {
    jest
      .mocked(quickOrderClientRepository.existsProductInShop)
      .mockResolvedValue(false);

    await expect(service.createQuickOrder(dto)).rejects.toThrow(
      new BadRequestException(QUICK_ORDER_MESSAGES.PRODUCT_NOT_FOUND),
    );
    expect(quickOrderClientRepository.create).not.toHaveBeenCalled();
    expect(quickOrderClientRepository.save).not.toHaveBeenCalled();
  });
});
