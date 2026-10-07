import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { Product } from '../catalog/entities/product.entity';
import { OrdersController } from './controllers/orders/admin/orders.controller';
import { OrdersClientController } from './controllers/orders/client/orders-client.controller';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderRepository } from './repositories/order/admin/order.repository';
import { OrderClientRepository } from './repositories/order/client/order-client.repository';
import { OrdersService } from './services/orders/admin/orders.service';
import { OrdersClientService } from './services/orders/client/orders-client.service';

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
  controllers: [OrdersController, OrdersClientController],
  providers: [
    OrdersService,
    OrdersClientService,
    OrderRepository,
    OrderClientRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class OrdersModule {}
