import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '../../entities/enums/notification.enum';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationsListener } from './notifications.listener';

describe('NotificationsListener', () => {
  let listener: NotificationsListener;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue({ id: 'n-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsListener,
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    listener = module.get<NotificationsListener>(NotificationsListener);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should create an order notification for the shop', async () => {
    await listener.handleOrderCreated({
      shopId: 'shop-1',
      orderId: 'order-1',
      orderNumber: '1001',
      totalAmount: '95.00',
      firstName: 'Taras',
      lastName: null,
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      'shop-1',
      NotificationType.ORDER_CREATED,
      {
        orderId: 'order-1',
        orderNumber: '1001',
        totalAmount: '95.00',
        firstName: 'Taras',
        lastName: null,
      },
    );
  });

  it('should create a new customer notification for the shop', async () => {
    await listener.handleCustomerRegistered({
      shopId: 'shop-1',
      userId: 'user-1',
      email: null,
      mobileNumber: '+380501234567',
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      'shop-1',
      NotificationType.CUSTOMER_REGISTERED,
      { userId: 'user-1', email: null, mobileNumber: '+380501234567' },
    );
  });

  it('should log and swallow failures', async () => {
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    jest
      .mocked(notificationsService.createNotification)
      .mockRejectedValue(new Error('db down'));

    await expect(
      listener.handleCustomerRegistered({
        shopId: 'shop-1',
        userId: 'user-1',
        email: null,
        mobileNumber: null,
      }),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('customer_registered'),
    );
  });
});
