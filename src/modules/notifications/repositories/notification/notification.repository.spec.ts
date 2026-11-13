import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationRead } from '../../entities/notification-read.entity';
import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let typeOrmRepository: any;
  let readRepository: any;
  let queryBuilder: any;
  let insertQueryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
    };

    insertQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };

    readRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(insertQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: getRepositoryToken(Notification),
          useValue: typeOrmRepository,
        },
        {
          provide: getRepositoryToken(NotificationRead),
          useValue: readRepository,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAllPaginated', () => {
    it('should list shop notifications with the admin read state', async () => {
      const notifications = [{ id: 'n-1' }] as Notification[];
      queryBuilder.getManyAndCount.mockResolvedValue([notifications, 1]);

      const result = await repository.findAllPaginated(
        { shopId: 'shop-1', userId: 'user-1', unreadOnly: false },
        0,
        20,
      );

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'notification',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'notification.reads',
        'read',
        'read.userId = :userId',
        { userId: 'user-1' },
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'notification.shopId = :shopId',
        { shopId: 'shop-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'notification.createdAt',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'notification.id',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({ items: notifications, total: 1 });
    });

    it('should keep only unread notifications when asked', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(
        { shopId: 'shop-1', userId: 'user-1', unreadOnly: true },
        20,
        20,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'read.notificationId IS NULL',
      );
    });
  });

  it('should count unread notifications of a shop for an admin', async () => {
    queryBuilder.getCount.mockResolvedValue(3);

    const result = await repository.countUnread('shop-1', 'user-1');

    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'notification.reads',
      'read',
      'read.userId = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'notification.shopId = :shopId',
      { shopId: 'shop-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'read.notificationId IS NULL',
    );
    expect(result).toBe(3);
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      const notification = { id: 'n-1' } as Notification;
      typeOrmRepository.findOne.mockResolvedValue(notification);

      const result = await repository.findById('n-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'n-1' },
      });
      expect(result).toEqual(notification);
    });

    it('should throw when notification is not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should create notification entity', () => {
    const payload = { shopId: 'shop-1' };
    typeOrmRepository.create.mockReturnValue({ id: 'n-1', ...payload });

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ id: 'n-1', shopId: 'shop-1' });
  });

  it('should save notification entity', async () => {
    const notification = { id: 'n-1' } as Notification;
    typeOrmRepository.save.mockResolvedValue(notification);

    const result = await repository.save(notification);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(notification);
    expect(result).toEqual(notification);
  });

  it('should mark a notification as read, ignoring a repeated read', async () => {
    await repository.markAsRead('n-1', 'user-1');

    expect(insertQueryBuilder.into).toHaveBeenCalledWith(NotificationRead);
    expect(insertQueryBuilder.values).toHaveBeenCalledWith({
      notificationId: 'n-1',
      userId: 'user-1',
    });
    expect(insertQueryBuilder.orIgnore).toHaveBeenCalled();
    expect(insertQueryBuilder.execute).toHaveBeenCalled();
  });

  it('should mark every notification of a shop as read with parameters', async () => {
    await repository.markAllAsRead('shop-1', 'user-1');

    expect(typeOrmRepository.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT DO NOTHING'),
      ['shop-1', 'user-1'],
    );
  });
});
