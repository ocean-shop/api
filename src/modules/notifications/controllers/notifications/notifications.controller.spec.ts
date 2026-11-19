import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: NotificationsService;

  const user = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
    mobileNumber: null,
  };
  const request = { user } as any;

  beforeEach(async () => {
    const notificationsServiceMock = {
      listNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      streamNotifications: jest.fn(),
      markAllAsRead: jest.fn(),
      markAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list notifications for the current admin', async () => {
    const query = { shopId: 'shop-1', page: 1, limit: 20 };
    const response = {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
    jest
      .mocked(notificationsService.listNotifications)
      .mockResolvedValue(response);

    const result = await controller.listNotifications(query, request);

    expect(notificationsService.listNotifications).toHaveBeenCalledWith(
      query,
      user,
    );
    expect(result).toEqual(response);
  });

  it('should return the unread count', async () => {
    jest
      .mocked(notificationsService.getUnreadCount)
      .mockResolvedValue({ count: 2 });

    const result = await controller.getUnreadCount(
      { shopId: 'shop-1' },
      request,
    );

    expect(notificationsService.getUnreadCount).toHaveBeenCalledWith(
      'shop-1',
      user,
    );
    expect(result).toEqual({ count: 2 });
  });

  it('should open the live stream of the shop', () => {
    const stream = of({ data: {} });
    jest
      .mocked(notificationsService.streamNotifications)
      .mockReturnValue(stream);

    const result = controller.streamNotifications({ shopId: 'shop-1' });

    expect(notificationsService.streamNotifications).toHaveBeenCalledWith(
      'shop-1',
    );
    expect(result).toBe(stream);
  });

  it('should mark all notifications as read', async () => {
    const response = { message: 'ok' };
    jest.mocked(notificationsService.markAllAsRead).mockResolvedValue(response);

    const result = await controller.markAllAsRead(
      { shopId: 'shop-1' },
      request,
    );

    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
      'shop-1',
      user,
    );
    expect(result).toEqual(response);
  });

  it('should mark one notification as read', async () => {
    const response = { message: 'ok' };
    jest.mocked(notificationsService.markAsRead).mockResolvedValue(response);

    const result = await controller.markAsRead('n-1', request);

    expect(notificationsService.markAsRead).toHaveBeenCalledWith('n-1', user);
    expect(result).toEqual(response);
  });
});
