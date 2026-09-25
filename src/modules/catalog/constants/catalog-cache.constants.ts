/**
 * TTLs are a safety net, not the primary invalidation mechanism: admin writes
 * bump the shop's cache version immediately. They bound how long a response can
 * stay stale if a write path ever forgets to invalidate.
 */

/** Popular products change only when an admin flags a product. */
export const POPULAR_PRODUCTS_CACHE_TTL_SECONDS = 300;

/** Filter options change only when attributes or category membership change. */
export const CATALOG_FILTERS_CACHE_TTL_SECONDS = 300;

/**
 * Shorter than the others: the filter/page combinations form a long tail, so a
 * tight TTL keeps rarely repeated keys from accumulating in Redis.
 */
export const CATALOG_PRODUCTS_CACHE_TTL_SECONDS = 60;
