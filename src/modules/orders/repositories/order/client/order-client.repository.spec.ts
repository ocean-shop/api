import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../../catalog/entities/product.entity';
import { OrderProduct } from '../../../entities/order-product.entity';
import { Order } from '../../../entities/order.entity';
import { OrderClientRepository } from './order-client.repository';

describe('OrderClientRepository', () => {
  let repository: OrderClientRepository;
  let typeOrmRepository: any;
  let itemRepository: any;
  let productRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      create: jest.fn(),
    };

    itemRepository = {
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    productRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderClientRepository,
        {
          provide: getRepositoryToken(Order),
          useValue: typeOrmRepository,
        },
        {
          provide: getRepositoryToken(OrderProduct),
          useValue: itemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    repository = module.get<OrderClientRepository>(OrderClientRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create order entity', () => {
    const payload = { shopId: 'shop-id', userId: 'user-id' };
    const order = { id: 'order-id', ...payload };
    typeOrmRepository.create.mockReturnValue(order);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(order);
  });

  it('should replace order items', async () => {
    const items = [
      { productId: 'p1', unitPrice: 10.5, quantity: 2 },
      { productId: 'p2', unitPrice: 2, quantity: 1 },
    ];
    const created = [
      { orderId: 'order-id', productId: 'p1', unitPrice: '10.5', quantity: 2 },
      { orderId: 'order-id', productId: 'p2', unitPrice: '2', quantity: 1 },
    ];

    itemRepository.delete.mockResolvedValue(undefined);
    itemRepository.create.mockImplementation((payload) => payload);
    itemRepository.save.mockResolvedValue(created);

    const result = await repository.replaceItems('order-id', items);

    expect(itemRepository.delete).toHaveBeenCalledWith({ orderId: 'order-id' });
    expect(itemRepository.create).toHaveBeenCalledTimes(2);
    expect(itemRepository.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('should clear order items when list is empty', async () => {
    itemRepository.delete.mockResolvedValue(undefined);

    const result = await repository.replaceItems('order-id', []);

    expect(itemRepository.delete).toHaveBeenCalledWith({ orderId: 'order-id' });
    expect(itemRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should validate products for shop', async () => {
    productRepository.find.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);

    await repository.validateProductsForShop('shop-id', ['p1', 'p2']);

    expect(productRepository.find).toHaveBeenCalledWith({
      where: {
        shopId: 'shop-id',
        id: expect.anything(),
      },
      select: {
        id: true,
      },
    });
  });

  it('should throw when products are missing for shop', async () => {
    productRepository.find.mockResolvedValue([{ id: 'p1' }]);

    await expect(
      repository.validateProductsForShop('shop-id', ['p1', 'p2']),
    ).rejects.toThrow('Невідомі ID продуктів для цього магазину: p2');
  });
});
