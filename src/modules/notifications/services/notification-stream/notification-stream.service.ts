import {
  Inject,
  Injectable,
  Logger,
  MessageEvent,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { Observable, Subject, filter, interval, map, merge } from 'rxjs';
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_HEARTBEAT_INTERVAL_MS,
  NOTIFICATION_PUBLISHER,
  NOTIFICATION_SSE_EVENTS,
  NOTIFICATION_SUBSCRIBER,
} from '../../constants/notification.constants';
import { toStreamedNotification } from '../../helpers/notification/notification.helpers';
import {
  NotificationResponse,
  StreamedNotification,
} from '../../models/notification.models';

/**
 * Delivers new notifications to connected admins. With Redis every instance
 * publishes to one channel and relays what it receives, so an admin gets the
 * event whichever instance created it. Without Redis (local development, a
 * single instance) events go straight to an in-memory subject.
 */
@Injectable()
export class NotificationStreamService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationStreamService.name);
  private readonly notifications$ = new Subject<StreamedNotification>();

  constructor(
    @Optional()
    @Inject(NOTIFICATION_PUBLISHER)
    private readonly publisher: Redis | null = null,
    @Optional()
    @Inject(NOTIFICATION_SUBSCRIBER)
    private readonly subscriber: Redis | null = null,
  ) {}

  onModuleInit(): void {
    const subscriber = this.subscriber;

    if (!subscriber) {
      return;
    }

    subscriber.on('message', (channel: string, message: string) =>
      this.handleMessage(channel, message),
    );

    // Not awaited: boot must not hang while Redis is unreachable. ioredis
    // queues the command and re-subscribes after every reconnect.
    subscriber.subscribe(NOTIFICATION_CHANNEL).catch((error: unknown) => {
      this.warn('subscribe', error);
    });
  }

  /**
   * Never throws: the notification is already stored, so a failed push only
   * means admins see it on their next fetch instead of instantly.
   */
  async publish(notification: StreamedNotification): Promise<void> {
    const item = toStreamedNotification(notification);

    if (!this.publisher) {
      this.notifications$.next(item);
      return;
    }

    try {
      await this.publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(item));
    } catch (error) {
      this.warn('publish', error);
      // Still reach the admins connected to this instance.
      this.notifications$.next(item);
    }
  }

  /** Live events for one shop, interleaved with keep-alive heartbeats. */
  stream(shopId: string): Observable<MessageEvent> {
    const notifications = this.notifications$.pipe(
      filter((notification) => notification.shopId === shopId),
      map(
        (notification): MessageEvent => ({
          type: NOTIFICATION_SSE_EVENTS.NOTIFICATION,
          id: notification.id,
          data: this.toUnreadResponse(notification),
        }),
      ),
    );

    const heartbeats = interval(NOTIFICATION_HEARTBEAT_INTERVAL_MS).pipe(
      map(
        (): MessageEvent => ({
          type: NOTIFICATION_SSE_EVENTS.HEARTBEAT,
          data: {},
        }),
      ),
    );

    return merge(notifications, heartbeats);
  }

  async onModuleDestroy(): Promise<void> {
    this.notifications$.complete();
    await Promise.all([
      this.closeClient(this.publisher),
      this.closeClient(this.subscriber),
    ]);
  }

  private handleMessage(channel: string, message: string): void {
    if (channel !== NOTIFICATION_CHANNEL) {
      return;
    }

    try {
      this.notifications$.next(JSON.parse(message) as StreamedNotification);
    } catch (error) {
      this.warn('parse message', error);
    }
  }

  private toUnreadResponse(
    notification: StreamedNotification,
  ): NotificationResponse {
    return { ...notification, isRead: false, readAt: null };
  }

  private async closeClient(client: Redis | null): Promise<void> {
    if (!client) {
      return;
    }

    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }

  private warn(operation: string, error: unknown): void {
    this.logger.warn(
      `Notification stream ${operation} failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
