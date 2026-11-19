import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { Product } from '../catalog/entities/product.entity';
import { OrdersController } from './controllers/orders/admin/orders.controller';
import { OrdersClientController } from './controllers/orders/client/orders-client.controller';
import { QuickOrdersController } from './controllers/quick-orders/admin/quick-orders.controller';
import { QuickOrdersClientController } from './controllers/quick-orders/client/quick-orders-client.controller';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { QuickOrder } from './entities/quick-order.entity';
import { OrderRepository } from './repositories/order/admin/order.repository';
import { OrderClientRepository } from './repositories/order/client/order-client.repository';
import { QuickOrderRepository } from './repositories/quick-order/admin/quick-order.repository';
import { QuickOrderClientRepository } from './repositories/quick-order/client/quick-order-client.repository';
import { OrderEmailService } from './services/email/order-email.service';
import { OrdersService } from './services/orders/admin/orders.service';
import { OrdersClientService } from './services/orders/client/orders-client.service';
import { QuickOrdersService } from './services/quick-orders/admin/quick-orders.service';
import { QuickOrdersClientService } from './services/quick-orders/client/quick-orders-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProduct, QuickOrder, Product]),
  ],
  controllers: [
    OrdersController,
    OrdersClientController,
    QuickOrdersController,
    QuickOrdersClientController,
  ],
  providers: [
    OrdersService,
    OrdersClientService,
    QuickOrdersService,
    QuickOrdersClientService,
    OrderEmailService,
    OrderRepository,
    OrderClientRepository,
    QuickOrderRepository,
    QuickOrderClientRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class OrdersModule {}
