import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductStatus } from '../../entities/enums/product.enum';
import { UserFavoriteProduct } from '../../entities/user-favorite-product.entity';
import { ProductQueryRepository } from '../product/common/product-query.repository';

@Injectable()
export class FavoriteProductRepository extends ProductQueryRepository {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
    @InjectRepository(UserFavoriteProduct)
    private readonly favoriteRepository: Repository<UserFavoriteProduct>,
  ) {
    super(repository);
  }

  async existsActiveProduct(
    shopId: string,
    productId: string,
  ): Promise<boolean> {
    return this.repository.exists({
      where: { id: productId, shopId, status: ProductStatus.ACTIVE },
    });
  }

  // Adding an already favorite product is a no-op, so a double tap in the
  // storefront does not surface as a conflict.
  async add(
    userId: string,
    shopId: string,
    productId: string,
  ): Promise<UserFavoriteProduct> {
    await this.favoriteRepository
      .createQueryBuilder()
      .insert()
      .into(UserFavoriteProduct)
      .values({ userId, shopId, productId })
      .orIgnore()
      .execute();

    return this.favoriteRepository.findOneOrFail({
      where: { userId, productId },
    });
  }

  /** Returns whether a favorite was actually removed. */
  async remove(userId: string, productId: string): Promise<boolean> {
    const result = await this.favoriteRepository.delete({ userId, productId });

    return (result.affected ?? 0) > 0;
  }

  /**
   * The active products a user favorited in a shop, newest favorite first,
   * loaded with the same relations as the catalog listings.
   */
  async findProductsPaginated(
    userId: string,
    shopId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin(
            UserFavoriteProduct,
            'favorite',
            'favorite.productId = product.id',
          )
          .andWhere('favorite.userId = :userId', { userId })
          .andWhere('favorite.shopId = :shopId', { shopId })
          .andWhere('product.status = :status', {
            status: ProductStatus.ACTIVE,
          });
      },
      skip,
      take,
      [{ expression: 'favorite.createdAt', direction: 'DESC' }],
    );
  }
}
