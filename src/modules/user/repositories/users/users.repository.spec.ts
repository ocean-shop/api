import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { User } from '../../entities/user.entity';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let userTypeOrmRepository: any;
  let orderTypeOrmRepository: any;

  beforeEach(async () => {
    userTypeOrmRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    orderTypeOrmRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: userTypeOrmRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should return empty result when no users are linked to shop', async () => {
    const countQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    const baseQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      clone: jest
        .fn()
        .mockReturnValueOnce(countQueryBuilder)
        .mockReturnValueOnce({}),
    };
    userTypeOrmRepository.createQueryBuilder.mockReturnValue(baseQueryBuilder);

    const result = await repository.findUsersByShopId(
      'shop-id',
      0,
      20,
      'john',
      '555',
      'asc',
    );

    expect(userTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'user',
    );
    expect(baseQueryBuilder.innerJoin).toHaveBeenNthCalledWith(
      1,
      'users_shops',
      'usersShops',
      'usersShops.user_id = user.id AND usersShops.shop_id = :shopId',
      { shopId: 'shop-id' },
    );
    expect(baseQueryBuilder.innerJoin).toHaveBeenNthCalledWith(
      2,
      'user.role',
      'role',
      'role.name = :roleName',
      { roleName: 'user' },
    );
    expect(countQueryBuilder.getCount).toHaveBeenCalled();
    expect(baseQueryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'user.email ILIKE :email',
      { email: '%john%' },
    );
    expect(baseQueryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'user.mobileNumber ILIKE :phoneNumber',
      { phoneNumber: '%555%' },
    );
    expect(userTypeOrmRepository.find).not.toHaveBeenCalled();
    expect(orderTypeOrmRepository.find).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should return paginated users with sessions, otps, role and orders', async () => {
    const countQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(2),
    };
    const idsQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ id: 'user-2' }, { id: 'user-1' }]),
    };
    const baseQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      clone: jest
        .fn()
        .mockReturnValueOnce(countQueryBuilder)
        .mockReturnValueOnce(idsQueryBuilder),
    };

    userTypeOrmRepository.createQueryBuilder.mockReturnValue(baseQueryBuilder);
    userTypeOrmRepository.find.mockResolvedValue([
      {
        id: 'user-1',
        role: { name: 'user' },
        sessions: [{ id: 's1' }],
        otps: [{ id: 'o1' }],
      },
      {
        id: 'user-2',
        role: { name: 'user' },
        sessions: [{ id: 's2' }],
        otps: [{ id: 'o2' }],
      },
    ]);
    orderTypeOrmRepository.find.mockResolvedValue([
      { id: 'order-1', userId: 'user-2', shopId: 'shop-id' },
      { id: 'order-2', userId: 'user-1', shopId: 'shop-id' },
      { id: 'order-3', userId: 'user-2', shopId: 'shop-id' },
    ]);

    const result = await repository.findUsersByShopId(
      'shop-id',
      10,
      10,
      undefined,
      undefined,
      'asc',
    );

    expect(baseQueryBuilder.andWhere).not.toHaveBeenCalled();
    expect(idsQueryBuilder.orderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'ASC',
    );
    expect(idsQueryBuilder.skip).toHaveBeenCalledWith(10);
    expect(idsQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(userTypeOrmRepository.find).toHaveBeenCalledWith({
      where: { id: expect.anything() },
      relations: {
        role: true,
        sessions: true,
        otps: true,
      },
    });
    expect(orderTypeOrmRepository.find).toHaveBeenCalledWith({
      where: {
        shopId: 'shop-id',
        userId: expect.anything(),
      },
      order: { createdAt: 'DESC' },
    });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('user-2');
    expect(result.items[0].orders).toEqual([
      { id: 'order-1', userId: 'user-2', shopId: 'shop-id' },
      { id: 'order-3', userId: 'user-2', shopId: 'shop-id' },
    ]);
    expect(result.items[1].id).toBe('user-1');
    expect(result.items[1].orders).toEqual([
      { id: 'order-2', userId: 'user-1', shopId: 'shop-id' },
    ]);
  });
});
