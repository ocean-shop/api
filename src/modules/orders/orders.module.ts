import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { Product } from '../catalog/entities/product.entity';
import { OrdersController } from './controllers/orders/orders.controller';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderRepository } from './repositories/order/order.repository';
import { OrdersService } from './services/orders/orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProduct, Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository, JwtAuthGuard, RolesGuard],
})
export class OrdersModule {}
