import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_ROLES } from '../../../user/constants/role.constants';
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import {
  PRODUCT_REPORT_LIMITS,
  REPORT_GRANULARITIES,
} from '../../constants/finance-report.constants';
import { FinanceReportQueryDto } from '../../dto/finance-reports/finance-report-query.dto';
import { GetProductReportQueryDto } from '../../dto/finance-reports/get-product-report-query.dto';
import { GetRevenueReportQueryDto } from '../../dto/finance-reports/get-revenue-report-query.dto';
import {
  CustomerReport,
  ProductReport,
  RevenueReport,
} from '../../models/finance-report.models';
import { CustomerReportsService } from '../../services/customer-reports/customer-reports.service';
import { ProductReportsService } from '../../services/product-reports/product-reports.service';
import { RevenueReportsService } from '../../services/revenue-reports/revenue-reports.service';

const PERIOD_QUERY_DOCS = [
  { name: 'shopId', required: true, type: String, format: 'uuid' },
  { name: 'from', required: false, type: String, example: '2026-11-01' },
  { name: 'to', required: false, type: String, example: '2026-11-30' },
] as const;

@Controller('finance/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Finance Reports')
@ApiBearerAuth('access-token')
export class FinanceReportsController {
  constructor(
    private readonly revenueReportsService: RevenueReportsService,
    private readonly productReportsService: ProductReportsService,
    private readonly customerReportsService: CustomerReportsService,
  ) {}

  @Get('revenue')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Revenue report: sales, discounts, paid vs outstanding, cancellations, breakdowns, timeline and insights vs the previous period',
  })
  @ApiQuery(PERIOD_QUERY_DOCS[0])
  @ApiQuery(PERIOD_QUERY_DOCS[1])
  @ApiQuery(PERIOD_QUERY_DOCS[2])
  @ApiQuery({ name: 'groupBy', required: false, enum: REPORT_GRANULARITIES })
  async getRevenueReport(
    @Query() query: GetRevenueReportQueryDto,
  ): Promise<RevenueReport> {
    return this.revenueReportsService.getRevenueReport(query);
  }

  @Get('products')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Product report: ABC analysis by revenue, growing/declining products, dead stock and insights',
  })
  @ApiQuery(PERIOD_QUERY_DOCS[0])
  @ApiQuery(PERIOD_QUERY_DOCS[1])
  @ApiQuery(PERIOD_QUERY_DOCS[2])
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: PRODUCT_REPORT_LIMITS.DEFAULT_LIMIT,
  })
  @ApiQuery({
    name: 'deadStockDays',
    required: false,
    type: Number,
    example: PRODUCT_REPORT_LIMITS.DEFAULT_DEAD_STOCK_DAYS,
  })
  async getProductReport(
    @Query() query: GetProductReportQueryDto,
  ): Promise<ProductReport> {
    return this.productReportsService.getProductReport(query);
  }

  @Get('customers')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Customer report: LTV, repeat rate, new vs returning revenue, RFM segments and insights',
  })
  @ApiQuery(PERIOD_QUERY_DOCS[0])
  @ApiQuery(PERIOD_QUERY_DOCS[1])
  @ApiQuery(PERIOD_QUERY_DOCS[2])
  async getCustomerReport(
    @Query() query: FinanceReportQueryDto,
  ): Promise<CustomerReport> {
    return this.customerReportsService.getCustomerReport(query);
  }
}
