import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderProduct } from '../orders/entities/order-product.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { FinanceReportsController } from './controllers/finance-reports/finance-reports.controller';
import { CustomerReportRepository } from './repositories/customer-report/customer-report.repository';
import { ProductReportRepository } from './repositories/product-report/product-report.repository';
import { RevenueReportRepository } from './repositories/revenue-report/revenue-report.repository';
import { CustomerReportsService } from './services/customer-reports/customer-reports.service';
import { ProductReportsService } from './services/product-reports/product-reports.service';
import { RevenueReportsService } from './services/revenue-reports/revenue-reports.service';

/** Smart financial reports for the admin panel (read-only, built on orders data). */
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderProduct, Product])],
  controllers: [FinanceReportsController],
  providers: [
    RevenueReportsService,
    ProductReportsService,
    CustomerReportsService,
    RevenueReportRepository,
    ProductReportRepository,
    CustomerReportRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class FinanceModule {}
