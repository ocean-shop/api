import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from '../../../../user/models/auth-request.models';
import { ListFavoriteProductsQueryDto } from '../../../dto/favorites/list-favorite-products-query.dto';
import { AddFavoriteProductDto } from '../../../dto/favorites/add-favorite-product.dto';
import { UserFavoriteProduct } from '../../../entities/user-favorite-product.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../helpers/list-response.helpers';
import { ProductListResponse } from '../../../models/product.models';
import { FavoriteProductRepository } from '../../../repositories/favorite-product/favorite-product.repository';

@Injectable()
export class FavoritesClientService {
  constructor(
    private readonly favoriteProductRepository: FavoriteProductRepository,
  ) {}

  async addFavoriteProduct(
    userId: string,
    dto: AddFavoriteProductDto,
    requester?: JwtPayload,
  ): Promise<UserFavoriteProduct> {
    this.assertCanAccess(userId, requester);

    // A draft product, or one of another shop, is treated as missing rather
    // than forbidden: the storefront has no business knowing it exists.
    const exists = await this.favoriteProductRepository.existsActiveProduct(
      dto.shopId,
      dto.productId,
    );

    if (!exists) {
      throw new NotFoundException('Продукт не знайдено');
    }

    return this.favoriteProductRepository.add(
      userId,
      dto.shopId,
      dto.productId,
    );
  }

  async removeFavoriteProduct(
    userId: string,
    productId: string,
    requester?: JwtPayload,
  ): Promise<void> {
    this.assertCanAccess(userId, requester);

    const removed = await this.favoriteProductRepository.remove(
      userId,
      productId,
    );

    if (!removed) {
      throw new NotFoundException('Обраний продукт не знайдено');
    }
  }

  async listFavoriteProducts(
    userId: string,
    query: ListFavoriteProductsQueryDto,
    requester?: JwtPayload,
  ): Promise<ProductListResponse> {
    this.assertCanAccess(userId, requester);

    const { page, limit, skip } = resolvePagination(query);
    const { items, total } =
      await this.favoriteProductRepository.findProductsPaginated(
        userId,
        query.shopId,
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }

  private assertCanAccess(userId: string, requester?: JwtPayload): void {
    if (requester?.role === 'user' && requester.sub !== userId) {
      throw new ForbiddenException('Доступ заборонено');
    }
  }
}
