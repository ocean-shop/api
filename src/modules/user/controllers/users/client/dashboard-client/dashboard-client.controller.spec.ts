import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard-client.controller';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { JwtAuthGuard } from '../../../../guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles/roles.guard';
import { AuthenticatedRequest } from '../../../../models/auth-request.models';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: DashboardService;

  const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
  const shopId = '1c7d3e2a-5b6f-4a8e-9c0d-2e3f4a5b6c7d';
  const request = {
    user: { sub: userId, email: null, role: 'user', mobileNumber: null },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const dashboardServiceMock = {
      getDashboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should call dashboardService.getDashboard', async () => {
      const query = { shopId };
      const expectedResult = {
        lastActiveOrders: [],
        ordersCount: 5,
        activeOrdersCount: 2,
        favoriteProductsCount: 7,
        mainShipping: null,
        lastFavoriteProducts: [],
      };

      jest
        .mocked(dashboardService.getDashboard)
        .mockResolvedValue(expectedResult);

      const result = await controller.getDashboard(userId, query, request);

      expect(dashboardService.getDashboard).toHaveBeenCalledWith(
        userId,
        query,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
