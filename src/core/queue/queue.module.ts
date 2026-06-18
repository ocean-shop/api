import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from './constants/queue.constants';
import { isEmailQueueEnabled } from './helpers/queue.helpers';

@Module({})
export class QueueModule {
  /**
   * Registers BullMQ (and the Redis connection) only when
   * `EMAIL_QUEUE_ENABLED=true`, so the app can run without Redis.
   */
  static register(): DynamicModule {
    if (!isEmailQueueEnabled()) {
      return { module: QueueModule };
    }

    return {
      module: QueueModule,
      global: true,
      imports: [
        BullModule.forRootAsync({
          useFactory: (configService: ConfigService) => {
            const redisUrl = new URL(
              configService.getOrThrow<string>('REDIS_URL'),
            );
            return {
              connection: {
                host: redisUrl.hostname,
                port: redisUrl.port ? parseInt(redisUrl.port, 10) : 6379,
                username: redisUrl.username || undefined,
                password: redisUrl.password || undefined,
                tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
              },
            };
          },
          inject: [ConfigService],
        }),
        BullModule.registerQueue({ name: EMAIL_QUEUE }),
      ],
      exports: [BullModule],
    };
  }
}
