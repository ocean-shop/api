import { createHash } from 'node:crypto';
import {
  CatalogFilter,
  CatalogProductFilters,
  CatalogProductSearchFilters,
  CommonCatalogProductFilters,
} from '../models/product.models';

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
  // The category id stays readable so a key can be traced back in redis-cli.
  return [
    'products',
    filters.categoryId,
    hashCatalogFilters(filters, page, limit),
  ];
}

/**
 * Builds the cache key segments for a page of search results.
 *
 * Unlike the category id, the term goes into the hash: it is free text, so
 * hashing keeps arbitrary user input out of the key and bounds its length. The
 * term has to arrive normalized, so that terms differing only in case or
 * spacing share one key.
 */
export function buildCatalogProductSearchCacheSegments(
  filters: CatalogProductSearchFilters,
  page: number,
  limit: number,
): string[] {
  return [
    'products-search',
    hashCatalogFilters(filters, page, limit, {
      term: filters.term,
      categoryIds: filters.categoryIds,
    }),
  ];
}

/**
 * Builds the cache key segments for a search term.
 *
 * The term is free text, so it is hashed: that keeps arbitrary user input out
 * of the key and bounds its length. The term has to arrive normalized, so that
 * terms differing only in case or spacing share one key.
 */
export function buildProductSearchCacheSegments(term: string): string[] {
  return ['search', hashTerm(term)];
}

/**
 * Builds the cache key segments for the filters available to a search term.
 *
 * Kept apart from the page segments on purpose: the filters vary by term only,
 * so paging or ticking a filter box reuses one entry instead of recomputing the
 * options for every combination.
 */
export function buildCatalogSearchFiltersCacheSegments(term: string): string[] {
  return ['filters-search', hashTerm(term)];
}

/**
 * Builds the cache key segments for the categories available to a search term.
 *
 * Kept apart from the page and the filter segments for the same reason: the
 * categories vary by term only, so paging or ticking a filter box reuses one
 * entry instead of recollecting them for every combination.
 */
export function buildCatalogSearchCategoriesCacheSegments(
  term: string,
): string[] {
  return ['categories-search', hashTerm(term)];
}

function hashTerm(term: string): string {
  return createHash('sha1').update(term).digest('hex');
}

/** What a search narrows by on top of the filters every listing shares. */
type SearchCacheKeyParts = {
  term: string;
  categoryIds?: string[];
};

/** Hashes everything a listing varies by, in a form independent of its spelling. */
function hashCatalogFilters(
  filters: CommonCatalogProductFilters,
  page: number,
  limit: number,
  search?: SearchCacheKeyParts,
): string {
  const canonical = JSON.stringify({
    attributes: canonicalizeAttributes(filters.attributes),
    available: filters.available ?? null,
    // Sorted and deduplicated for the same reason as the attributes: the ids
    // are combined with OR, so their order cannot change the page.
    categoryIds: [...new Set(search?.categoryIds ?? [])].sort(),
    limit,
    page,
    priceFrom: filters.priceFrom ?? null,
    priceTo: filters.priceTo ?? null,
    sort: filters.sort ?? null,
    term: search?.term ?? null,
  });

  return createHash('sha1').update(canonical).digest('hex');
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
