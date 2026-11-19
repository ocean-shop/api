import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from './core/cache/cache.module';
import { MailModule } from './core/mail/mail.module';
import { QueueModule } from './core/queue/queue.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl:
          configService.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    // In-process domain events (e.g. order created → admin notification).
    EventEmitterModule.forRoot(),
    CacheModule.register(),
    MailModule,
    QueueModule.register(),
    CatalogModule,
    NotificationsModule,
    OrdersModule,
    SettingsModule,
    StatisticModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
