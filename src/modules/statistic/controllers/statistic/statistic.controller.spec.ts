import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { StatisticService } from '../../services/statistic/statistic.service';
import { StatisticController } from './statistic.controller';

describe('StatisticController', () => {
  let controller: StatisticController;
  let statisticService: StatisticService;

  beforeEach(async () => {
    const statisticServiceMock = {
      getShopStatistic: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [StatisticController],
      providers: [
        { provide: StatisticService, useValue: statisticServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<StatisticController>(StatisticController);
    statisticService = module.get<StatisticService>(StatisticService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return shop statistics by shop id', async () => {
    const statistic = {
      orders: [],
      products: [],
      users: [],
    };
    jest.mocked(statisticService.getShopStatistic).mockResolvedValue(statistic);

    const result = await controller.getShopStatistic({ shopId: 'shop-id' });

    expect(statisticService.getShopStatistic).toHaveBeenCalledWith('shop-id');
    expect(result).toEqual(statistic);
  });
});
