import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
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
      findOne: jest.fn(),
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
      'users_shops',
      'users_shops.user_id = user.id AND users_shops.shop_id = :shopId',
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

  it('should return paginated users without loading orders', async () => {
    const countQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(2),
    };
    const idsQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
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
      },
      {
        id: 'user-2',
      },
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
    });
    expect(orderTypeOrmRepository.find).not.toHaveBeenCalled();
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('user-2');
    expect(result.items[1].id).toBe('user-1');
  });

  it('should return user details by id', async () => {
    const expected = {
      id: '98f21967-fce6-4ceb-af61-304913f593a7',
      role: { name: 'user' },
      sessions: [{ id: 'session-1' }],
      otps: [{ id: 'otp-1' }],
    };
    const expectedOrders = [
      { id: 'order-2', userId: expected.id },
      { id: 'order-1', userId: expected.id },
    ];
    userTypeOrmRepository.findOne.mockResolvedValue(expected);
    orderTypeOrmRepository.find.mockResolvedValue(expectedOrders);

    const result = await repository.findUserDetailsById(expected.id);

    expect(userTypeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: expected.id },
      relations: {
        role: true,
        sessions: true,
        otps: true,
      },
    });
    expect(orderTypeOrmRepository.find).toHaveBeenCalledWith({
      where: { userId: expected.id },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual({
      ...expected,
      orders: expectedOrders,
    });
  });

  it('should throw when user details are not found', async () => {
    userTypeOrmRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findUserDetailsById('98f21967-fce6-4ceb-af61-304913f593a7'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
