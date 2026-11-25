import { Injectable } from '@nestjs/common';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { ListProductReviewsQueryDto } from '../../../dto/product-reviews/list-product-reviews-query.dto';
import { UpdateProductReviewStatusDto } from '../../../dto/product-reviews/update-product-review-status.dto';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewsListResponse } from '../../../models/product-review.models';
import { ProductReviewRepository } from '../../../repositories/product-review/admin/product-review.repository';

@Injectable()
export class ProductReviewsService {
  constructor(
    private readonly productReviewRepository: ProductReviewRepository,
  ) {}

  async listProductReviews(
    query: ListProductReviewsQueryDto,
  ): Promise<ProductReviewsListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const filters = {
      shopId: query.shopId,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.rating ? { rating: query.rating } : {}),
      ...(query.sortOrder ? { sortOrder: query.sortOrder } : {}),
    };

    const { items, total } =
      await this.productReviewRepository.findAllPaginated(filters, skip, limit);

    return toListResponse(items, total, page, limit);
  }

  /**
   * Moderation: any status can move to any other (e.g. an approved review
   * can be hidden again by rejecting it). Re-setting the same status is a no-op.
   */
  async updateProductReviewStatus(
    id: string,
    dto: UpdateProductReviewStatusDto,
  ): Promise<ProductReview> {
    const review = await this.productReviewRepository.findById(id);

    if (review.status === dto.status) {
      return review;
    }

    review.status = dto.status;

    return this.productReviewRepository.save(review);
  }
}
