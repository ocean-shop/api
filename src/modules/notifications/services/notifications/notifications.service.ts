import {
  Injectable,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response/list-response.helpers';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../../user/constants/auth-messages.constants';
import { JwtPayload } from '../../../user/models/auth-request.models';
import { NOTIFICATION_MESSAGES } from '../../constants/notification-messages.constants';
import { ListNotificationsQueryDto } from '../../dto/notification/list-notifications-query.dto';
import { NotificationType } from '../../entities/enums/notification.enum';
import { Notification } from '../../entities/notification.entity';
import { toNotificationResponse } from '../../helpers/notification/notification.helpers';
import {
  NotificationPayload,
  NotificationsListResponse,
  UnreadCountResponse,
} from '../../models/notification.models';
import { NotificationRepository } from '../../repositories/notification/notification.repository';
import { NotificationStreamService } from '../notification-stream/notification-stream.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationStreamService: NotificationStreamService,
  ) {}

  /** Stores the notification first, so a missed live push loses nothing. */
  async createNotification(
    shopId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({ shopId, type, payload }),
    );

    await this.notificationStreamService.publish(notification);

    return notification;
  }

  async listNotifications(
    query: ListNotificationsQueryDto,
    requester?: JwtPayload,
  ): Promise<NotificationsListResponse> {
    const userId = this.resolveUserId(requester);
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } = await this.notificationRepository.findAllPaginated(
      {
        shopId: query.shopId,
        userId,
        unreadOnly: query.unreadOnly ?? false,
      },
      skip,
      limit,
    );

    return toListResponse(
      items.map((item) => toNotificationResponse(item)),
      total,
      page,
      limit,
    );
  }

  async getUnreadCount(
    shopId: string,
    requester?: JwtPayload,
  ): Promise<UnreadCountResponse> {
    const userId = this.resolveUserId(requester);
    const count = await this.notificationRepository.countUnread(shopId, userId);

    return { count };
  }

  async markAsRead(
    id: string,
    requester?: JwtPayload,
  ): Promise<MessageResponse> {
    const userId = this.resolveUserId(requester);
    await this.notificationRepository.findById(id);
    await this.notificationRepository.markAsRead(id, userId);

    return { message: NOTIFICATION_MESSAGES.MARKED_AS_READ };
  }

  async markAllAsRead(
    shopId: string,
    requester?: JwtPayload,
  ): Promise<MessageResponse> {
    const userId = this.resolveUserId(requester);
    await this.notificationRepository.markAllAsRead(shopId, userId);

    return { message: NOTIFICATION_MESSAGES.ALL_MARKED_AS_READ };
  }

  streamNotifications(shopId: string): Observable<MessageEvent> {
    return this.notificationStreamService.stream(shopId);
  }

  /** Read state is per admin, so every read/write needs who is asking. */
  private resolveUserId(requester?: JwtPayload): string {
    if (!requester?.sub) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_REQUIRED);
    }

    return requester.sub;
  }
}
