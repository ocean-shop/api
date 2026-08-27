import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../catalog/entities/product.entity';
import { OrderProduct } from '../../entities/order-product.entity';
import { Order } from '../../entities/order.entity';
import { OrderRepository } from './order.repository';

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let typeOrmRepository: any;
  let itemRepository: any;
  let productRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
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
        OrderRepository,
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

    repository = module.get<OrderRepository>(OrderRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find all orders by shop id', async () => {
    const items = [{ id: 'order-1' }] as Order[];
    typeOrmRepository.findAndCount.mockResolvedValue([items, 1]);

    const result = await repository.findAllByShopId(
      'shop-id',
      0,
      20,
      'ORD-1001',
      'asc',
    );

    expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', orderNumber: expect.anything() },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: 'ASC' },
      skip: 0,
      take: 20,
    });
    expect(result).toEqual({ items, total: 1 });
  });

  it('should find all orders by shop id and user id', async () => {
    const items = [{ id: 'order-1' }] as Order[];
    typeOrmRepository.findAndCount.mockResolvedValue([items, 1]);

    const result = await repository.findAllByShopIdAndUserId(
      'shop-id',
      'user-id',
      10,
      5,
    );

    expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', userId: 'user-id' },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: 'DESC' },
      skip: 10,
      take: 5,
    });
    expect(result).toEqual({ items, total: 1 });
  });

  it('should find order by id', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.findOne.mockResolvedValue(order);

    const result = await repository.findById('order-id');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
    });
    expect(result).toEqual(order);
  });

  it('should throw when order not found', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create order entity', () => {
    const payload = { shopId: 'shop-id', userId: 'user-id' };
    const order = { id: 'order-id', ...payload };
    typeOrmRepository.create.mockReturnValue(order);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(order);
  });

  it('should save order entity', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.save.mockResolvedValue(order);

    const result = await repository.save(order);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(order);
    expect(result).toEqual(order);
  });

  it('should remove order entity', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.remove.mockResolvedValue(order);

    const result = await repository.remove(order);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(order);
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
