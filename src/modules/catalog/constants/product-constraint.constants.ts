export const PRODUCT_CONSTRAINTS = {
  UNIQUE_SKU: 'uq_products_shop_sku',
  UNIQUE_SLUG: 'uq_products_shop_slug',
  UNIQUE_VARIATION_ATTRIBUTE: 'variations_attributes_pkey',
  /** Matched by substring: every check on the old price carries it in its name. */
  OLD_PRICE_CHECK_FRAGMENT: 'old_price',
} as const;
