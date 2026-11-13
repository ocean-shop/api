import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { NotificationType } from '../../entities/enums/notification.enum';
import { NotificationRepository } from '../../repositories/notification/notification.repository';
import { NotificationStreamService } from '../notification-stream/notification-stream.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: NotificationRepository;
  let notificationStreamService: NotificationStreamService;

  const requester = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
    mobileNumber: null,
  };

  beforeEach(async () => {
    const notificationRepositoryMock = {
      findAllPaginated: jest.fn(),
      countUnread: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
    const notificationStreamServiceMock = {
      publish: jest.fn(),
      stream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: notificationRepositoryMock,
        },
        {
          provide: NotificationStreamService,
          useValue: notificationStreamServiceMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<NotificationRepository>(
      NotificationRepository,
    );
    notificationStreamService = module.get<NotificationStreamService>(
      NotificationStreamService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should store the notification and then publish it', async () => {
      const payload = {
        userId: 'user-1',
        email: 'client@example.com',
        mobileNumber: null,
      };
      const created = { shopId: 'shop-1' } as any;
      const saved = { id: 'n-1', shopId: 'shop-1' } as any;
      jest.mocked(notificationRepository.create).mockReturnValue(created);
      jest.mocked(notificationRepository.save).mockResolvedValue(saved);

      const result = await service.createNotification(
        'shop-1',
        NotificationType.CUSTOMER_REGISTERED,
        payload,
      );

      expect(notificationRepository.create).toHaveBeenCalledWith({
        shopId: 'shop-1',
        type: NotificationType.CUSTOMER_REGISTERED,
        payload,
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(created);
      expect(notificationStreamService.publish).toHaveBeenCalledWith(saved);
      expect(result).toEqual(saved);
    });
  });

  describe('listNotifications', () => {
    it('should return a page of notifications with read state', async () => {
      const readAt = new Date('2026-11-13T11:00:00Z');
      const notification = {
        id: 'n-1',
        shopId: 'shop-1',
        type: NotificationType.ORDER_CREATED,
        payload: {},
        createdAt: new Date('2026-11-13T10:00:00Z'),
        reads: [{ readAt }],
      } as any;
      jest
        .mocked(notificationRepository.findAllPaginated)
        .mockResolvedValue({ items: [notification], total: 1 });

      const result = await service.listNotifications(
        { shopId: 'shop-1', page: 2, limit: 10, unreadOnly: true },
        requester,
      );

      expect(notificationRepository.findAllPaginated).toHaveBeenCalledWith(
        { shopId: 'shop-1', userId: 'admin-1', unreadOnly: true },
        10,
        10,
      );
      expect(result).toEqual({
        items: [
          {
            id: 'n-1',
            shopId: 'shop-1',
            type: NotificationType.ORDER_CREATED,
            payload: {},
            createdAt: notification.createdAt,
            isRead: true,
            readAt,
          },
        ],
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should list every notification when unreadOnly is omitted', async () => {
      jest
        .mocked(notificationRepository.findAllPaginated)
        .mockResolvedValue({ items: [], total: 0 });

      await service.listNotifications(
        { shopId: 'shop-1', page: 1, limit: 20 },
        requester,
      );

      expect(notificationRepository.findAllPaginated).toHaveBeenCalledWith(
        { shopId: 'shop-1', userId: 'admin-1', unreadOnly: false },
        0,
        20,
      );
    });

    it('should throw UnauthorizedException without a requester', async () => {
      await expect(
        service.listNotifications({ shopId: 'shop-1', page: 1, limit: 20 }),
      ).rejects.toThrow(UnauthorizedException);
      expect(notificationRepository.findAllPaginated).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return the unread count of the admin', async () => {
      jest.mocked(notificationRepository.countUnread).mockResolvedValue(4);

      const result = await service.getUnreadCount('shop-1', requester);

      expect(notificationRepository.countUnread).toHaveBeenCalledWith(
        'shop-1',
        'admin-1',
      );
      expect(result).toEqual({ count: 4 });
    });
  });

  describe('markAsRead', () => {
    it('should mark an existing notification as read', async () => {
      jest
        .mocked(notificationRepository.findById)
        .mockResolvedValue({ id: 'n-1' } as any);

      const result = await service.markAsRead('n-1', requester);

      expect(notificationRepository.findById).toHaveBeenCalledWith('n-1');
      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'n-1',
        'admin-1',
      );
      expect(result).toEqual({ message: 'Сповіщення позначено як прочитане' });
    });

    it('should throw NotFoundException for a missing notification', async () => {
      jest
        .mocked(notificationRepository.findById)
        .mockRejectedValue(new NotFoundException());

      await expect(service.markAsRead('missing', requester)).rejects.toThrow(
        NotFoundException,
      );
      expect(notificationRepository.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark every notification of the shop as read', async () => {
      const result = await service.markAllAsRead('shop-1', requester);

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
        'shop-1',
        'admin-1',
      );
      expect(result).toEqual({
        message: 'Усі сповіщення позначено як прочитані',
      });
    });
  });

  describe('streamNotifications', () => {
    it('should return the live stream of the shop', () => {
      const stream = of({ data: {} });
      jest.mocked(notificationStreamService.stream).mockReturnValue(stream);

      const result = service.streamNotifications('shop-1');

      expect(notificationStreamService.stream).toHaveBeenCalledWith('shop-1');
      expect(result).toBe(stream);
    });
  });
});
