import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { AUTH_MESSAGES } from '../../../../user/constants/auth-messages.constants';
import { JwtPayload } from '../../../../user/models/auth-request.models';
import { PRODUCT_REVIEW_MESSAGES } from '../../../constants/product-review-messages.constants';
import { CreateProductReviewDto } from '../../../dto/product-reviews/create-product-review.dto';
import { ListProductReviewsClientQueryDto } from '../../../dto/product-reviews/list-product-reviews-client-query.dto';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewsListResponse } from '../../../models/product-review.models';
import { ProductReviewClientRepository } from '../../../repositories/product-review/client/product-review-client.repository';

@Injectable()
export class ProductReviewsClientService {
  constructor(
    private readonly productReviewClientRepository: ProductReviewClientRepository,
  ) {}

  /**
   * A new review waits for moderation (`pending`). "Approved purchase" is
   * derived from the author's orders, never taken from the request.
   */
  async createProductReview(
    dto: CreateProductReviewDto,
    requester?: JwtPayload,
  ): Promise<ProductReview> {
    if (!requester) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_REQUIRED);
    }

    await this.ensureActiveProductInShop(dto.shopId, dto.productId);

    const approvedPurchase =
      await this.productReviewClientRepository.hasPurchasedProduct(
        requester.sub,
        dto.shopId,
        dto.productId,
      );

    const review = this.productReviewClientRepository.create({
      shopId: dto.shopId,
      productId: dto.productId,
      userId: requester.sub,
      name: dto.name,
      advantages: dto.advantages ?? null,
      drawbacks: dto.drawbacks ?? null,
      comment: dto.comment,
      rating: dto.rating,
      status: ProductReviewStatus.PENDING,
      approvedPurchase,
    });

    return this.productReviewClientRepository.save(review);
  }

  async listProductReviews(
    productId: string,
    query: ListProductReviewsClientQueryDto,
  ): Promise<ProductReviewsListResponse> {
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.productReviewClientRepository.findApprovedByProductPaginated(
        query.shopId,
        productId,
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }

  /** A draft product, or one of another shop, is treated as missing. */
  private async ensureActiveProductInShop(
    shopId: string,
    productId: string,
  ): Promise<void> {
    const exists = await this.productReviewClientRepository.existsActiveProduct(
      shopId,
      productId,
    );

    if (!exists) {
      throw new NotFoundException(PRODUCT_REVIEW_MESSAGES.PRODUCT_NOT_FOUND);
    }
  }
}
