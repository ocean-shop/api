import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INSIGHT_CODES } from '../../constants/finance-report.constants';
import { CustomerReportRepository } from '../../repositories/customer-report/customer-report.repository';
import { CustomerReportsService } from './customer-reports.service';

const query = { shopId: 'shop-id', from: '2026-11-01', to: '2026-11-30' };

describe('CustomerReportsService', () => {
  let service: CustomerReportsService;
  let repository: jest.Mocked<CustomerReportRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findSummary: jest.fn(),
      findSegments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerReportsService,
        { provide: CustomerReportRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<CustomerReportsService>(CustomerReportsService);
    repository = module.get(CustomerReportRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build summary, segments and insights', async () => {
    repository.findSummary.mockResolvedValue({
      totalCustomers: '10',
      repeatCustomers: '1',
      guestCustomers: '4',
      lifetimeRevenue: '5000.00',
      lifetimeOrders: '13',
      activeCustomers: '6',
      newCustomers: '4',
      returningCustomers: '2',
      periodRevenue: '2000.00',
      returningRevenue: '500.00',
    });
    repository.findSegments.mockResolvedValue([
      {
        frequency: '2',
        recencyBucket: '3',
        customersCount: '1',
        revenue: '700',
      },
      {
        frequency: '1',
        recencyBucket: '0',
        customersCount: '9',
        revenue: '4300',
      },
    ]);

    const result = await service.getCustomerReport(query);

    const period = {
      from: '2026-11-01',
      to: '2026-11-30',
      toExclusive: '2026-12-01',
      days: 30,
    };
    expect(repository.findSummary).toHaveBeenCalledWith('shop-id', period);
    expect(repository.findSegments).toHaveBeenCalledWith('shop-id', period);
    expect(result.period).toEqual(period);
    expect(result.summary).toEqual({
      totalCustomers: 10,
      repeatCustomers: 1,
      repeatRate: 0.1,
      guestCustomers: 4,
      averageLtv: 500,
      averageOrdersPerCustomer: 1.3,
      activeCustomers: 6,
      newCustomers: 4,
      returningCustomers: 2,
      periodRevenue: 2000,
      returningRevenue: 500,
      returningRevenueShare: 0.25,
    });
    expect(
      result.segments.find((item) => item.segment === 'atRisk'),
    ).toMatchObject({ customersCount: 1, revenue: 700 });
    expect(result.insights.map((insight) => insight.code)).toEqual([
      INSIGHT_CODES.LOW_REPEAT_RATE,
      INSIGHT_CODES.AT_RISK_CUSTOMERS,
    ]);
  });

  it('should return zeros for a shop without orders', async () => {
    repository.findSummary.mockResolvedValue(undefined);
    repository.findSegments.mockResolvedValue([]);

    const result = await service.getCustomerReport(query);

    expect(result.summary.totalCustomers).toBe(0);
    expect(result.summary.averageLtv).toBe(0);
    expect(result.summary.returningRevenueShare).toBe(0);
    expect(result.insights).toEqual([]);
  });

  it('should reject an invalid period without querying', async () => {
    await expect(
      service.getCustomerReport({ ...query, from: '2026-12-15' }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.findSummary).not.toHaveBeenCalled();
  });
});
