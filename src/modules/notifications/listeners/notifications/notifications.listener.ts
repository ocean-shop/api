import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../constants/notification.constants';
import { NotificationType } from '../../entities/enums/notification.enum';
import type {
  CustomerRegisteredEvent,
  NotificationPayload,
  OrderCreatedEvent,
} from '../../models/notification.models';
import { NotificationsService } from '../../services/notifications/notifications.service';

/**
 * Turns domain events into admin notifications. Runs asynchronously, so the
 * order or sign-in that emitted the event never waits for it or fails with it.
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CREATED, { async: true })
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const { shopId, ...payload } = event;
    await this.saveNotification(
      shopId,
      NotificationType.ORDER_CREATED,
      payload,
    );
  }

  @OnEvent(NOTIFICATION_EVENTS.CUSTOMER_REGISTERED, { async: true })
  async handleCustomerRegistered(
    event: CustomerRegisteredEvent,
  ): Promise<void> {
    const { shopId, ...payload } = event;
    await this.saveNotification(
      shopId,
      NotificationType.CUSTOMER_REGISTERED,
      payload,
    );
  }

  private async saveNotification(
    shopId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(shopId, type, payload);
    } catch (error) {
      this.logger.error(
        `Failed to create ${type} notification for shop ${shopId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
