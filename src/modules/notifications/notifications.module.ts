import { Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis, { RedisOptions } from 'ioredis';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import {
  NOTIFICATION_PUBLISHER,
  NOTIFICATION_SUBSCRIBER,
} from './constants/notification.constants';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationRead } from './entities/notification-read.entity';
import { NotificationsListener } from './listeners/notifications/notifications.listener';
import { NotificationRepository } from './repositories/notification/notification.repository';
import { NotificationStreamService } from './services/notification-stream/notification-stream.service';
import { NotificationsService } from './services/notifications/notifications.service';

/**
 * Pub/sub needs two connections: a subscribed Redis client cannot issue other
 * commands. Without `REDIS_URL` both resolve to null and the stream stays
 * in-process, which is enough for a single instance.
 */
const redisClientProvider = (
  token: string,
  name: string,
  options: RedisOptions,
): Provider => {
  return {
    provide: token,
    useFactory: (configService: ConfigService): Redis | null => {
      const url = configService.get<string>('REDIS_URL');

      if (!url) {
        return null;
      }

      const logger = new Logger(name);
      const client = new Redis(url, options);
      let outageReported = false;

      // ioredis crashes the process on an unhandled 'error' event.
      client.on('error', (error: Error) => {
        if (outageReported) {
          return;
        }

        outageReported = true;
        logger.warn(`Redis unavailable: ${error.message}`);
      });

      client.on('ready', () => {
        outageReported = false;
      });

      return client;
    },
    inject: [ConfigService],
  };
};

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationRead])],
  controllers: [NotificationsController],
  providers: [
    // Publishing fails fast during an outage so the service can fall back to
    // the local stream instead of queueing.
    redisClientProvider(NOTIFICATION_PUBLISHER, 'NotificationPublisher', {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    }),
    redisClientProvider(NOTIFICATION_SUBSCRIBER, 'NotificationSubscriber', {}),
    NotificationRepository,
    NotificationStreamService,
    NotificationsService,
    NotificationsListener,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class NotificationsModule {}
