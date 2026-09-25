import { createHash } from 'node:crypto';
import { CatalogFilter, CatalogProductFilters } from '../models/product.models';

/**
 * Builds the cache key segments for a catalog page.
 *
 * The filter combinations are open ended, so the variable part is hashed to
 * keep keys short and bounded. Everything that reaches the query builder has to
 * be in the hash, and requests that differ only in argument order have to
 * produce the same hash — otherwise logically identical pages miss the cache.
 */
export function buildCatalogProductsCacheSegments(
  filters: CatalogProductFilters,
  page: number,
  limit: number,
): string[] {
  const canonical = JSON.stringify({
    attributes: canonicalizeAttributes(filters.attributes),
    available: filters.available ?? null,
    limit,
    page,
    priceFrom: filters.priceFrom ?? null,
    priceTo: filters.priceTo ?? null,
    sort: filters.sort ?? null,
  });

  // The category id stays readable so a key can be traced back in redis-cli.
  return [
    'products',
    filters.categoryId,
    createHash('sha1').update(canonical).digest('hex'),
  ];
}

/**
 * Attribute filters are combined with OR inside a name and AND across names,
 * so neither the order of the names nor the order of the values changes the
 * result set. Sorting both makes the key independent of how the client
 * serialised the query string.
 */
function canonicalizeAttributes(
  attributes: CatalogFilter[] | undefined,
): Array<[string, string[]]> {
  if (!attributes?.length) {
    return [];
  }

  return attributes
    .map((attribute): [string, string[]] => [
      attribute.name,
      [...new Set(attribute.values)].sort(),
    ])
    .sort(([left], [right]) => left.localeCompare(right));
}
