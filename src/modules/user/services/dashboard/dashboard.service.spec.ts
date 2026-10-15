import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteProductRepository } from '../../../catalog/repositories/favorite-product/favorite-product.repository';
import { DashboardRepository } from '../../repositories/dashboard/dashboard.repository';
import { ShippingRepository } from '../../repositories/shipping/shipping.repository';
import { UserRepository } from '../../repositories/user/user.repository';
import { JwtPayload } from '../../models/auth-request.models';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
  const shopId = '1c7d3e2a-5b6f-4a8e-9c0d-2e3f4a5b6c7d';
  const requester: JwtPayload = {
    sub: userId,
    email: null,
    role: 'user',
    mobileNumber: null,
  };

  const userRepository = { findById: jest.fn() };
  const dashboardRepository = {
    countOrders: jest.fn(),
    findLastActiveOrders: jest.fn(),
  };
  const shippingRepository = { findMainByUserId: jest.fn() };
  const favoriteProductRepository = { findProductsPaginated: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: UserRepository, useValue: userRepository },
        { provide: DashboardRepository, useValue: dashboardRepository },
        { provide: ShippingRepository, useValue: shippingRepository },
        {
          provide: FavoriteProductRepository,
          useValue: favoriteProductRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should aggregate orders, shipping and favorite products', async () => {
    const orders = [{ id: 'order-1' }, { id: 'order-2' }];
    const products = [{ id: 'product-1' }];
    const mainShipping = { id: 'shipping-1', userId, isMain: true };

    userRepository.findById.mockResolvedValue({ id: userId });
    dashboardRepository.countOrders.mockResolvedValue(10);
    dashboardRepository.findLastActiveOrders.mockResolvedValue({
      items: orders,
      total: 2,
    });
    shippingRepository.findMainByUserId.mockResolvedValue(mainShipping);
    favoriteProductRepository.findProductsPaginated.mockResolvedValue({
      items: products,
      total: 6,
    });

    const result = await service.getDashboard(userId, { shopId }, requester);

    expect(dashboardRepository.countOrders).toHaveBeenCalledWith(
      shopId,
      userId,
    );
    expect(dashboardRepository.findLastActiveOrders).toHaveBeenCalledWith(
      shopId,
      userId,
      3,
    );
    expect(shippingRepository.findMainByUserId).toHaveBeenCalledWith(userId);
    expect(
      favoriteProductRepository.findProductsPaginated,
    ).toHaveBeenCalledWith(userId, shopId, 0, 4);
    expect(result).toEqual({
      lastActiveOrders: orders,
      ordersCount: 10,
      activeOrdersCount: 2,
      favoriteProductsCount: 6,
      mainShipping,
      lastFavoriteProducts: products,
    });
  });

  it('should forbid a client from reading another user dashboard', async () => {
    await expect(
      service.getDashboard('another-user-id', { shopId }, requester),
    ).rejects.toThrow(ForbiddenException);

    expect(userRepository.findById).not.toHaveBeenCalled();
  });
});
