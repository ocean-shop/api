/**
 * Price shown in the catalog: the cheapest variation for variable products,
 * the product price otherwise.
 */
export const EFFECTIVE_PRICE_EXPRESSION = `COALESCE((SELECT MIN(catalog_variation.price) FROM product_variations catalog_variation WHERE catalog_variation.product_id = product.id), product.price)`;
