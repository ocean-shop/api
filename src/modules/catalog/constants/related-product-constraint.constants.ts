export const RELATED_PRODUCT_CONSTRAINTS = {
  NOT_SELF: 'chk_products_related_not_self',
  PRODUCT_FK: 'fk_products_related_product',
  RELATED_PRODUCT_FK: 'fk_products_related_related_product',
} as const;

/**
 * Foreign keys a related product can violate when it is deleted or moved
 * between the validation and the insert.
 */
export const RELATED_PRODUCT_FK_CONSTRAINTS: readonly string[] = [
  RELATED_PRODUCT_CONSTRAINTS.PRODUCT_FK,
  RELATED_PRODUCT_CONSTRAINTS.RELATED_PRODUCT_FK,
];
