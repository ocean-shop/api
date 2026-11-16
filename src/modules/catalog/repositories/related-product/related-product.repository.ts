import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductStatus } from '../../entities/enums/product.enum';
import { ProductRelated } from '../../entities/product-related.entity';
import { ProductQueryRepository } from '../product/common/product-query.repository';

@Injectable()
export class RelatedProductRepository extends ProductQueryRepository {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
    @InjectRepository(ProductRelated)
    private readonly relatedRepository: Repository<ProductRelated>,
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

  /** The subset of `productIds` that exists in the shop, in no particular order. */
  async findExistingIdsInShop(
    shopId: string,
    productIds: string[],
  ): Promise<string[]> {
    if (productIds.length === 0) {
      return [];
    }

    const products = await this.repository.find({
      select: { id: true },
      where: { shopId, id: In(productIds) },
    });

    return products.map((product) => product.id);
  }

  /**
   * Replaces the whole related list of a product atomically. The position in
   * `relatedProductIds` becomes the display order.
   */
  async replace(
    productId: string,
    shopId: string,
    relatedProductIds: string[],
  ): Promise<void> {
    await this.relatedRepository.manager.transaction(async (manager) => {
      await manager.delete(ProductRelated, { productId });

      if (relatedProductIds.length === 0) {
        return;
      }

      await manager.insert(
        ProductRelated,
        relatedProductIds.map((relatedProductId, index) => ({
          productId,
          relatedProductId,
          shopId,
          sortOrder: index,
        })),
      );
    });
  }

  /**
   * The related products of a product in display order, loaded with the same
   * relations as the catalog cards. With `status` only products in that status
   * are returned, so the storefront never sees drafts.
   */
  async findRelatedProducts(
    productId: string,
    status?: ProductStatus,
  ): Promise<Product[]> {
    const query = this.relatedRepository
      .createQueryBuilder('related')
      .innerJoin('related.relatedProduct', 'product')
      .select('related.relatedProductId', 'id')
      .where('related.productId = :productId', { productId })
      .orderBy('related.sortOrder', 'ASC')
      .addOrderBy('related.createdAt', 'ASC');

    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    const rows = await query.getRawMany<{ id: string }>();

    if (rows.length === 0) {
      return [];
    }

    return this.findProductsWithRelationsInOrder(rows.map((row) => row.id));
  }
}
