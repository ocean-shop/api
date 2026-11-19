import { Logger, MessageEvent } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_HEARTBEAT_INTERVAL_MS,
  NOTIFICATION_PUBLISHER,
  NOTIFICATION_SUBSCRIBER,
} from '../../constants/notification.constants';
import { NotificationType } from '../../entities/enums/notification.enum';
import { NotificationStreamService } from './notification-stream.service';

describe('NotificationStreamService', () => {
  const notification = {
    id: 'n-1',
    shopId: 'shop-1',
    type: NotificationType.ORDER_CREATED,
    payload: {
      orderId: 'order-1',
      orderNumber: '1001',
      totalAmount: '95.00',
      firstName: null,
      lastName: null,
    },
    createdAt: new Date('2026-11-13T10:00:00Z'),
  };

  const expectedEvent: MessageEvent = {
    type: 'notification',
    id: 'n-1',
    data: { ...notification, isRead: false, readAt: null },
  };

  const createService = async (
    publisher: any = null,
    subscriber: any = null,
  ): Promise<NotificationStreamService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStreamService,
        { provide: NOTIFICATION_PUBLISHER, useValue: publisher },
        { provide: NOTIFICATION_SUBSCRIBER, useValue: subscriber },
      ],
    }).compile();

    return module.get<NotificationStreamService>(NotificationStreamService);
  };

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('without Redis', () => {
    it('should push a published notification to streams of its shop', async () => {
      const service = await createService();
      const received = firstValueFrom(service.stream('shop-1'));

      await service.publish(notification);

      await expect(received).resolves.toEqual(expectedEvent);
    });

    it('should not push a notification to streams of another shop', async () => {
      const service = await createService();
      const next = jest.fn();
      const subscription = service.stream('shop-2').subscribe(next);

      await service.publish(notification);

      expect(next).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should send heartbeats while the stream is open', async () => {
      jest.useFakeTimers();
      const service = await createService();
      const received = firstValueFrom(
        service.stream('shop-1').pipe(take(2), toArray()),
      );

      jest.advanceTimersByTime(NOTIFICATION_HEARTBEAT_INTERVAL_MS * 2);

      await expect(received).resolves.toEqual([
        { type: 'heartbeat', data: {} },
        { type: 'heartbeat', data: {} },
      ]);
    });

    it('should skip subscribing and closing when there is no client', async () => {
      const service = await createService();

      service.onModuleInit();

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('with Redis', () => {
    let publisher: any;
    let subscriber: any;
    let messageHandler: (channel: string, message: string) => void;

    beforeEach(() => {
      publisher = {
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
        disconnect: jest.fn(),
      };
      subscriber = {
        on: jest.fn((event: string, handler: typeof messageHandler) => {
          if (event === 'message') {
            messageHandler = handler;
          }
        }),
        subscribe: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
        disconnect: jest.fn(),
      };
    });

    it('should publish notifications to the Redis channel', async () => {
      const service = await createService(publisher, subscriber);
      const next = jest.fn();
      const subscription = service.stream('shop-1').subscribe(next);

      await service.publish({ ...notification, reads: [] } as any);

      expect(publisher.publish).toHaveBeenCalledWith(
        NOTIFICATION_CHANNEL,
        JSON.stringify(notification),
      );
      // Delivery happens when the message comes back through the subscriber.
      expect(next).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should relay messages received on the channel to the stream', async () => {
      const service = await createService(publisher, subscriber);
      service.onModuleInit();
      const received = firstValueFrom(service.stream('shop-1'));

      messageHandler(NOTIFICATION_CHANNEL, JSON.stringify(notification));

      expect(subscriber.subscribe).toHaveBeenCalledWith(NOTIFICATION_CHANNEL);
      await expect(received).resolves.toEqual({
        ...expectedEvent,
        data: {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          isRead: false,
          readAt: null,
        },
      });
    });

    it('should ignore messages from other channels and invalid payloads', async () => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const service = await createService(publisher, subscriber);
      service.onModuleInit();
      const next = jest.fn();
      const subscription = service.stream('shop-1').subscribe(next);

      messageHandler('other', JSON.stringify(notification));
      messageHandler(NOTIFICATION_CHANNEL, '{not json');

      expect(next).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
      subscription.unsubscribe();
    });

    it('should fall back to the local stream when publishing fails', async () => {
      publisher.publish.mockRejectedValue(new Error('Redis down'));
      const service = await createService(publisher, subscriber);
      const received = firstValueFrom(service.stream('shop-1'));

      await service.publish(notification);

      await expect(received).resolves.toEqual(expectedEvent);
    });

    it('should not fail boot when subscribing fails', async () => {
      subscriber.subscribe.mockRejectedValue(new Error('Redis down'));
      const service = await createService(publisher, subscriber);

      expect(() => service.onModuleInit()).not.toThrow();
      await new Promise(process.nextTick);
    });

    it('should close both Redis connections on shutdown', async () => {
      subscriber.quit.mockRejectedValue(new Error('already closed'));
      const service = await createService(publisher, subscriber);

      await service.onModuleDestroy();

      expect(publisher.quit).toHaveBeenCalled();
      expect(subscriber.quit).toHaveBeenCalled();
      expect(subscriber.disconnect).toHaveBeenCalled();
      expect(publisher.disconnect).not.toHaveBeenCalled();
    });
  });
});
