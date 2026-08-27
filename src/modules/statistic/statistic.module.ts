import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { StatisticController } from './controllers/statistic/statistic.controller';
import { StatisticRepository } from './repositories/statistic/statistic.repository';
import { StatisticService } from './services/statistic/statistic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StatisticController],
  providers: [StatisticService, StatisticRepository, JwtAuthGuard, RolesGuard],
})
export class StatisticModule {}
