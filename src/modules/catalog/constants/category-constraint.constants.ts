/** Unique constraints that reject a category slug already taken among its siblings. */
export const CATEGORY_DUPLICATE_SLUG_CONSTRAINTS: readonly string[] = [
  'uq_categories_shop_root_slug',
  'uq_categories_shop_parent_slug',
];
