import {
  ListResponse,
  SortOrder,
} from '../../../core/response/models/response.models';
import { ProductReviewStatus } from '../entities/enums/product-review.enum';
import { ProductReview } from '../entities/product-review.entity';

export type ProductReviewFilters = {
  shopId: string;
  productId?: string;
  status?: ProductReviewStatus;
  rating?: number;
  sortOrder?: SortOrder;
};

export type ProductReviewsListResponse = ListResponse<ProductReview>;
