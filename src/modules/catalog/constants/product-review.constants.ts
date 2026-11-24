import { OrderStatus } from '../../orders/entities/enums/order.enum';

/** Matches product_reviews.name VARCHAR(100). */
export const PRODUCT_REVIEW_NAME_MAX_LENGTH = 100;

/** Matches product_reviews.advantages / drawbacks VARCHAR(2000). */
export const PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH = 2000;

/** Matches product_reviews.comment VARCHAR(5000). */
export const PRODUCT_REVIEW_COMMENT_MAX_LENGTH = 5000;

/** Matches chk_product_reviews_rating. */
export const PRODUCT_REVIEW_RATING_MIN = 1;
export const PRODUCT_REVIEW_RATING_MAX = 5;

/**
 * Order statuses that prove the author actually bought the product: a pending
 * or cancelled order is not a purchase yet.
 */
export const PRODUCT_REVIEW_PURCHASE_ORDER_STATUSES = [
  OrderStatus.SHIPPED,
] as const;

/** Product fields returned with a review in the admin list. */
export const PRODUCT_REVIEW_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
} as const;

/** Review fields shown on the storefront: no author id or shop internals. */
export const PRODUCT_REVIEW_CLIENT_SELECT = {
  id: true,
  productId: true,
  name: true,
  advantages: true,
  drawbacks: true,
  comment: true,
  rating: true,
  approvedPurchase: true,
  isUseful: true,
  createdAt: true,
} as const;
