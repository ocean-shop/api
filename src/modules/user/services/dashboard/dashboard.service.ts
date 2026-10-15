import { ForbiddenException, Injectable } from '@nestjs/common';
import { FavoriteProductRepository } from '../../../catalog/repositories/favorite-product/favorite-product.repository';
import { DashboardQueryDto } from '../../dto/dashboard-query.dto';
import { JwtPayload } from '../../models/auth-request.models';
import { DashboardResponse } from '../../models/dashboard.models';
import { DashboardRepository } from '../../repositories/dashboard/dashboard.repository';
import { ShippingRepository } from '../../repositories/shipping/shipping.repository';
import { UserRepository } from '../../repositories/user/user.repository';

const CLIENT_ROLE_NAME = 'user';
const LAST_ACTIVE_ORDERS_LIMIT = 3;
const LAST_FAVORITE_PRODUCTS_LIMIT = 4;

@Injectable()
export class DashboardService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dashboardRepository: DashboardRepository,
    private readonly shippingRepository: ShippingRepository,
    private readonly favoriteProductRepository: FavoriteProductRepository,
  ) {}

  async getDashboard(
    userId: string,
    query: DashboardQueryDto,
    requester?: JwtPayload,
  ): Promise<DashboardResponse> {
    this.assertCanAccess(userId, requester);
    await this.userRepository.findById(userId);

    const [ordersCount, activeOrders, mainShipping, favoriteProducts] =
      await Promise.all([
        this.dashboardRepository.countOrders(query.shopId, userId),
        this.dashboardRepository.findLastActiveOrders(
          query.shopId,
          userId,
          LAST_ACTIVE_ORDERS_LIMIT,
        ),
        this.shippingRepository.findMainByUserId(userId),
        this.favoriteProductRepository.findProductsPaginated(
          userId,
          query.shopId,
          0,
          LAST_FAVORITE_PRODUCTS_LIMIT,
        ),
      ]);

    return {
      lastActiveOrders: activeOrders.items,
      ordersCount,
      activeOrdersCount: activeOrders.total,
      favoriteProductsCount: favoriteProducts.total,
      mainShipping,
      lastFavoriteProducts: favoriteProducts.items,
    };
  }

  private assertCanAccess(userId: string, requester?: JwtPayload): void {
    if (requester?.role === CLIENT_ROLE_NAME && requester.sub !== userId) {
      throw new ForbiddenException('Доступ заборонено');
    }
  }
}
