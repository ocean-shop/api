import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QUICK_ORDER_MESSAGES } from '../../../constants/quick-order-messages.constants';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderRepository } from '../../../repositories/quick-order/admin/quick-order.repository';
import { QuickOrdersService } from './quick-orders.service';

describe('QuickOrdersService', () => {
  let service: QuickOrdersService;
  let quickOrderRepository: QuickOrderRepository;

  const buildQuickOrder = (): QuickOrder =>
    ({
      id: 'quick-order-id',
      shopId: 'shop-id',
      productId: 'product-id',
      name: 'Олена',
      phone: '+380991234567',
      status: QuickOrderStatus.NEW,
    }) as QuickOrder;

  beforeEach(async () => {
    const quickOrderRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrdersService,
        { provide: QuickOrderRepository, useValue: quickOrderRepositoryMock },
      ],
    }).compile();

    service = module.get<QuickOrdersService>(QuickOrdersService);
    quickOrderRepository =
      module.get<QuickOrderRepository>(QuickOrderRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listQuickOrders', () => {
    it('should list quick orders with all filters', async () => {
      const items = [buildQuickOrder()];
      jest
        .mocked(quickOrderRepository.findAllPaginated)
        .mockResolvedValue({ items, total: 1 });

      const result = await service.listQuickOrders({
        shopId: 'shop-id',
        page: 2,
        limit: 10,
        status: QuickOrderStatus.NEW,
        search: 'Олена',
        sortOrder: 'asc',
      });

      expect(quickOrderRepository.findAllPaginated).toHaveBeenCalledWith(
        {
          shopId: 'shop-id',
          status: QuickOrderStatus.NEW,
          search: 'Олена',
          sortOrder: 'asc',
        },
        10,
        10,
      );
      expect(result).toEqual({
        items,
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should list quick orders with only the shop filter', async () => {
      jest
        .mocked(quickOrderRepository.findAllPaginated)
        .mockResolvedValue({ items: [], total: 0 });

      await service.listQuickOrders({ shopId: 'shop-id', page: 1, limit: 20 });

      expect(quickOrderRepository.findAllPaginated).toHaveBeenCalledWith(
        { shopId: 'shop-id' },
        0,
        20,
      );
    });
  });

  describe('getQuickOrderById', () => {
    it('should return quick order', async () => {
      const quickOrder = buildQuickOrder();
      jest.mocked(quickOrderRepository.findById).mockResolvedValue(quickOrder);

      const result = await service.getQuickOrderById('quick-order-id');

      expect(quickOrderRepository.findById).toHaveBeenCalledWith(
        'quick-order-id',
      );
      expect(result).toBe(quickOrder);
    });

    it('should rethrow not found', async () => {
      jest
        .mocked(quickOrderRepository.findById)
        .mockRejectedValue(new NotFoundException());

      await expect(service.getQuickOrderById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateQuickOrder', () => {
    it('should update provided fields', async () => {
      const quickOrder = buildQuickOrder();
      jest.mocked(quickOrderRepository.findById).mockResolvedValue(quickOrder);
      jest
        .mocked(quickOrderRepository.save)
        .mockImplementation(async (entity) => entity);

      const result = await service.updateQuickOrder('quick-order-id', {
        name: 'Іван',
        phone: '0991112233',
        status: QuickOrderStatus.PROCESSED,
      });

      expect(quickOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Іван',
          phone: '0991112233',
          status: QuickOrderStatus.PROCESSED,
        }),
      );
      expect(result.status).toBe(QuickOrderStatus.PROCESSED);
    });

    it('should keep fields that are not provided', async () => {
      const quickOrder = buildQuickOrder();
      jest.mocked(quickOrderRepository.findById).mockResolvedValue(quickOrder);
      jest
        .mocked(quickOrderRepository.save)
        .mockImplementation(async (entity) => entity);

      const result = await service.updateQuickOrder('quick-order-id', {});

      expect(result).toEqual(buildQuickOrder());
    });

    it('should throw when quick order does not exist', async () => {
      jest
        .mocked(quickOrderRepository.findById)
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.updateQuickOrder('missing', { status: QuickOrderStatus.NEW }),
      ).rejects.toThrow(NotFoundException);
      expect(quickOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeQuickOrder', () => {
    it('should remove quick order and return message', async () => {
      const quickOrder = buildQuickOrder();
      jest.mocked(quickOrderRepository.findById).mockResolvedValue(quickOrder);

      const result = await service.removeQuickOrder('quick-order-id');

      expect(quickOrderRepository.remove).toHaveBeenCalledWith(quickOrder);
      expect(result).toEqual({ message: QUICK_ORDER_MESSAGES.REMOVED });
    });

    it('should throw when quick order does not exist', async () => {
      jest
        .mocked(quickOrderRepository.findById)
        .mockRejectedValue(new NotFoundException());

      await expect(service.removeQuickOrder('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(quickOrderRepository.remove).not.toHaveBeenCalled();
    });
  });
});
