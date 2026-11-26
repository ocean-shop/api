import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import { CustomerReportsService } from '../../services/customer-reports/customer-reports.service';
import { ProductReportsService } from '../../services/product-reports/product-reports.service';
import { RevenueReportsService } from '../../services/revenue-reports/revenue-reports.service';
import { FinanceReportsController } from './finance-reports.controller';

describe('FinanceReportsController', () => {
  let controller: FinanceReportsController;
  let revenueReportsService: RevenueReportsService;
  let productReportsService: ProductReportsService;
  let customerReportsService: CustomerReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceReportsController],
      providers: [
        {
          provide: RevenueReportsService,
          useValue: { getRevenueReport: jest.fn() },
        },
        {
          provide: ProductReportsService,
          useValue: { getProductReport: jest.fn() },
        },
        {
          provide: CustomerReportsService,
          useValue: { getCustomerReport: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FinanceReportsController>(FinanceReportsController);
    revenueReportsService = module.get(RevenueReportsService);
    productReportsService = module.get(ProductReportsService);
    customerReportsService = module.get(CustomerReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the revenue report', async () => {
    const report = { summary: {} } as any;
    const query = { shopId: 'shop-id', groupBy: 'week' as const };
    jest
      .mocked(revenueReportsService.getRevenueReport)
      .mockResolvedValue(report);

    const result = await controller.getRevenueReport(query);

    expect(revenueReportsService.getRevenueReport).toHaveBeenCalledWith(query);
    expect(result).toBe(report);
  });

  it('should return the product report', async () => {
    const report = { topProducts: [] } as any;
    const query = { shopId: 'shop-id', limit: 10, deadStockDays: 30 };
    jest
      .mocked(productReportsService.getProductReport)
      .mockResolvedValue(report);

    const result = await controller.getProductReport(query);

    expect(productReportsService.getProductReport).toHaveBeenCalledWith(query);
    expect(result).toBe(report);
  });

  it('should return the customer report', async () => {
    const report = { segments: [] } as any;
    const query = { shopId: 'shop-id', from: '2026-11-01' };
    jest
      .mocked(customerReportsService.getCustomerReport)
      .mockResolvedValue(report);

    const result = await controller.getCustomerReport(query);

    expect(customerReportsService.getCustomerReport).toHaveBeenCalledWith(
      query,
    );
    expect(result).toBe(report);
  });
});
