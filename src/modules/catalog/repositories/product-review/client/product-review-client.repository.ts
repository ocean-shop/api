import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginatedResult } from '../../../../../core/response/models/response.models';
import { OrderProduct } from '../../../../orders/entities/order-product.entity';
import {
  PRODUCT_REVIEW_CLIENT_SELECT,
  PRODUCT_REVIEW_PURCHASE_ORDER_STATUSES,
} from '../../../constants/product-review.constants';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { Product } from '../../../entities/product.entity';

@Injectable()
export class ProductReviewClientRepository {
  constructor(
    @InjectRepository(ProductReview)
    private readonly repository: Repository<ProductReview>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
  ) {}

  async existsActiveProduct(
    shopId: string,
    productId: string,
  ): Promise<boolean> {
    return this.productRepository.exists({
      where: { id: productId, shopId, status: ProductStatus.ACTIVE },
    });
  }

  /** True when the user has a completed order of the shop with the product. */
  async hasPurchasedProduct(
    userId: string,
    shopId: string,
    productId: string,
  ): Promise<boolean> {
    return this.orderProductRepository.exists({
      where: {
        productId,
        order: {
          userId,
          shopId,
          status: In([...PRODUCT_REVIEW_PURCHASE_ORDER_STATUSES]),
        },
      },
    });
  }

  async findApprovedByProductPaginated(
    shopId: string,
    productId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<ProductReview>> {
    const [items, total] = await this.repository.findAndCount({
      where: { shopId, productId, status: ProductReviewStatus.APPROVED },
      select: PRODUCT_REVIEW_CLIENT_SELECT,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip,
      take,
    });

    return { items, total };
  }

  create(payload: Partial<ProductReview>): ProductReview {
    return this.repository.create(payload);
  }

  async save(review: ProductReview): Promise<ProductReview> {
    return this.repository.save(review);
  }
}
