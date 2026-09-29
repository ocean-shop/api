/**
 * Price shown in the catalog: the cheapest variation for variable products,
 * the product price otherwise.
 */
export const EFFECTIVE_PRICE_EXPRESSION = `COALESCE((SELECT MIN(catalog_variation.price) FROM product_variations catalog_variation WHERE catalog_variation.product_id = product.id), product.price)`;

/** Main image of a product: the one the admin sorted to the front. */
const MAIN_IMAGE_EXPRESSION = `(
      SELECT main_image.url
      FROM product_images main_image
      WHERE main_image.product_id = product.id
      ORDER BY main_image.sort ASC, main_image.created_at ASC
      LIMIT 1
    )`;

/**
 * Relevance of a search hit, best first: the exact name, then names starting
 * with the term, then names where a later word starts with it, then the
 * remaining substring matches. Popularity, then the shortest name, then the
 * newest product break the ties inside a tier, and the id keeps the order
 * stable so equally relevant products do not shuffle between requests.
 */
const SEARCH_ORDER_BY = `CASE
        WHEN product.name ILIKE $3 THEN 0
        WHEN product.name ILIKE $3 || '%' THEN 1
        WHEN product.name ILIKE '% ' || $3 || '%' THEN 2
        ELSE 3
      END ASC,
      product.is_popular DESC,
      length(product.name) ASC,
      product.created_at DESC,
      product.id ASC`;

/**
 * Search suggestions together with the total number of matches, in a single
 * statement.
 *
 * Parameters: `$1` shop id, `$2` product status, `$3` the search term with its
 * LIKE wildcards escaped, `$4` how many products to return.
 *
 * `COUNT(*) OVER ()` counts every match before `LIMIT` cuts the list down, so
 * the total costs neither a second scan nor a second round trip. The CTE is
 * aliased back to `product` in the outer query so the price and image
 * expressions, which are written against the products table, run for the few
 * returned rows instead of for every match.
 */
export const PRODUCT_SEARCH_QUERY = `
  WITH matches AS (
    SELECT
      product.id,
      product.name,
      product.price,
      product.old_price,
      product.is_popular,
      product.created_at,
      COUNT(*) OVER () AS total
    FROM products product
    WHERE product.shop_id = $1
      AND product.status = $2
      AND product.name ILIKE '%' || $3 || '%'
    ORDER BY
      ${SEARCH_ORDER_BY}
    LIMIT $4
  )
  SELECT
    product.id AS "id",
    product.name AS "name",
    ${EFFECTIVE_PRICE_EXPRESSION} AS "price",
    product.old_price AS "oldPrice",
    ${MAIN_IMAGE_EXPRESSION} AS "image",
    product.total AS "total"
  FROM matches product
  ORDER BY
    ${SEARCH_ORDER_BY}
`;
