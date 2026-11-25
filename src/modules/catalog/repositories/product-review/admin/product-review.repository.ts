import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../../../core/response/models/response.models';
import { PRODUCT_REVIEW_MESSAGES } from '../../../constants/product-review-messages.constants';
import { PRODUCT_REVIEW_PRODUCT_SELECT } from '../../../constants/product-review.constants';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewFilters } from '../../../models/product-review.models';

@Injectable()
export class ProductReviewRepository {
  constructor(
    @InjectRepository(ProductReview)
    private readonly repository: Repository<ProductReview>,
  ) {}

  async findAllPaginated(
    filters: ProductReviewFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<ProductReview>> {
    const direction = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const query = this.repository
      .createQueryBuilder('review')
      .leftJoin('review.product', 'product')
      .addSelect(
        Object.keys(PRODUCT_REVIEW_PRODUCT_SELECT).map(
          (field) => `product.${field}`,
        ),
      )
      .where('review.shopId = :shopId', { shopId: filters.shopId })
      .orderBy('review.createdAt', direction)
      .addOrderBy('review.id', direction)
      .skip(skip)
      .take(take);

    if (filters.productId) {
      query.andWhere('review.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.status) {
      query.andWhere('review.status = :status', { status: filters.status });
    }

    if (filters.rating) {
      query.andWhere('review.rating = :rating', { rating: filters.rating });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<ProductReview> {
    const review = await this.repository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException(PRODUCT_REVIEW_MESSAGES.NOT_FOUND);
    }

    return review;
  }

  async save(review: ProductReview): Promise<ProductReview> {
    return this.repository.save(review);
  }
}
