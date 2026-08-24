import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyStatisticRow } from '../../models/statistic.models';
import { StatisticRepository } from '../../repositories/statistic/statistic.repository';
import { StatisticService } from './statistic.service';

describe('StatisticService', () => {
  let service: StatisticService;
  let statisticRepository: StatisticRepository;

  beforeEach(async () => {
    const statisticRepositoryMock = {
      getMonthlyOrders: jest.fn(),
      getMonthlyProducts: jest.fn(),
      getMonthlyUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticService,
        { provide: StatisticRepository, useValue: statisticRepositoryMock },
      ],
    }).compile();

    service = module.get<StatisticService>(StatisticService);
    statisticRepository = module.get<StatisticRepository>(StatisticRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return mapped shop statistics for all categories', async () => {
    const ordersRows: MonthlyStatisticRow[] = [
      { year: '2026', month: '1', count: '3' },
      { year: '2026', month: '12', count: '11' },
    ];
    const productsRows: MonthlyStatisticRow[] = [
      { year: '2025', month: '4', count: '9' },
    ];
    const usersRows: MonthlyStatisticRow[] = [
      { year: '2024', month: '8', count: '5' },
    ];

    jest
      .mocked(statisticRepository.getMonthlyOrders)
      .mockResolvedValue(ordersRows);
    jest
      .mocked(statisticRepository.getMonthlyProducts)
      .mockResolvedValue(productsRows);
    jest
      .mocked(statisticRepository.getMonthlyUsers)
      .mockResolvedValue(usersRows);

    const result = await service.getShopStatistic('shop-id');

    expect(statisticRepository.getMonthlyOrders).toHaveBeenCalledWith(
      'shop-id',
    );
    expect(statisticRepository.getMonthlyProducts).toHaveBeenCalledWith(
      'shop-id',
    );
    expect(statisticRepository.getMonthlyUsers).toHaveBeenCalledWith('shop-id');
    expect(result).toEqual({
      orders: [
        {
          year: 2026,
          month: 'January',
          monthNumber: 1,
          count: 3,
        },
        {
          year: 2026,
          month: 'December',
          monthNumber: 12,
          count: 11,
        },
      ],
      products: [
        {
          year: 2025,
          month: 'April',
          monthNumber: 4,
          count: 9,
        },
      ],
      users: [
        {
          year: 2024,
          month: 'August',
          monthNumber: 8,
          count: 5,
        },
      ],
    });
  });
});
