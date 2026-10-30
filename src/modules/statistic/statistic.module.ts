import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { User } from '../user/entities/user.entity';
import { StatisticController } from './controllers/statistic/statistic.controller';
import { StatisticRepository } from './repositories/statistic/statistic.repository';
import { StatisticService } from './services/statistic/statistic.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User])],
  controllers: [StatisticController],
  providers: [StatisticService, StatisticRepository, JwtAuthGuard, RolesGuard],
})
export class StatisticModule {}
