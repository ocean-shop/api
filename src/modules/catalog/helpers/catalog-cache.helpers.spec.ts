import {
  CatalogProductFilters,
  CatalogProductSearchFilters,
  CatalogProductSort,
} from '../models/product.models';
import {
  buildCatalogProductSearchCacheSegments,
  buildCatalogProductsCacheSegments,
  buildCatalogSearchFiltersCacheSegments,
  buildProductSearchCacheSegments,
} from './catalog-cache.helpers';

describe('buildCatalogProductsCacheSegments', () => {
  const baseFilters: CatalogProductFilters = {
    shopId: 'shop-id',
    categoryId: 'category-id',
  };

  it('should keep the category id readable in the key', () => {
    const segments = buildCatalogProductsCacheSegments(baseFilters, 1, 20);

    expect(segments[0]).toBe('products');
    expect(segments[1]).toBe('category-id');
    expect(segments[2]).toMatch(/^[0-9a-f]{40}$/);
  });

  it('should ignore the order of attribute names and values', () => {
    const first = buildCatalogProductsCacheSegments(
      {
        ...baseFilters,
        attributes: [
          { name: 'screen', values: ['6'] },
          { name: 'color', values: ['Red', 'Blue'] },
        ],
      },
      1,
      20,
    );

    const second = buildCatalogProductsCacheSegments(
      {
        ...baseFilters,
        attributes: [
          { name: 'color', values: ['Blue', 'Red'] },
          { name: 'screen', values: ['6'] },
        ],
      },
      1,
      20,
    );

    expect(first).toEqual(second);
  });

  it('should ignore repeated values of the same attribute', () => {
    const withDuplicates = buildCatalogProductsCacheSegments(
      {
        ...baseFilters,
        attributes: [{ name: 'color', values: ['Red', 'Red'] }],
      },
      1,
      20,
    );

    const withoutDuplicates = buildCatalogProductsCacheSegments(
      { ...baseFilters, attributes: [{ name: 'color', values: ['Red'] }] },
      1,
      20,
    );

    expect(withDuplicates).toEqual(withoutDuplicates);
  });

  it('should treat an empty attribute list as no attribute filter', () => {
    expect(
      buildCatalogProductsCacheSegments(
        { ...baseFilters, attributes: [] },
        1,
        20,
      ),
    ).toEqual(buildCatalogProductsCacheSegments(baseFilters, 1, 20));
  });

  it.each([
    ['page', { page: 2, limit: 20 }],
    ['limit', { page: 1, limit: 40 }],
  ])('should separate pages that differ by %s', (_label, pagination) => {
    expect(
      buildCatalogProductsCacheSegments(
        baseFilters,
        pagination.page,
        pagination.limit,
      ),
    ).not.toEqual(buildCatalogProductsCacheSegments(baseFilters, 1, 20));
  });

  it.each<[string, Partial<CatalogProductFilters>]>([
    ['sort', { sort: CatalogProductSort.CHEAPER }],
    ['availability', { available: true }],
    ['priceFrom', { priceFrom: 60 }],
    ['priceTo', { priceTo: 6000 }],
    ['category', { categoryId: 'other-category-id' }],
  ])('should separate pages that differ by %s', (_label, override) => {
    expect(
      buildCatalogProductsCacheSegments({ ...baseFilters, ...override }, 1, 20),
    ).not.toEqual(buildCatalogProductsCacheSegments(baseFilters, 1, 20));
  });

  it('should not separate pages that differ only by an absent filter', () => {
    expect(
      buildCatalogProductsCacheSegments(
        { ...baseFilters, priceFrom: undefined, sort: undefined },
        1,
        20,
      ),
    ).toEqual(buildCatalogProductsCacheSegments(baseFilters, 1, 20));
  });
});

describe('buildCatalogProductSearchCacheSegments', () => {
  const baseFilters: CatalogProductSearchFilters = {
    shopId: 'shop-id',
    term: 'ocean tee',
  };

  it('should keep the user input out of the key', () => {
    const segments = buildCatalogProductSearchCacheSegments(baseFilters, 1, 20);

    expect(segments[0]).toBe('products-search');
    expect(segments[1]).toMatch(/^[0-9a-f]{40}$/);
  });

  it.each<[string, Partial<CatalogProductSearchFilters>]>([
    ['term', { term: 'tee' }],
    ['sort', { sort: CatalogProductSort.CHEAPER }],
    ['availability', { available: true }],
    ['priceFrom', { priceFrom: 60 }],
    ['priceTo', { priceTo: 6000 }],
    ['attributes', { attributes: [{ name: 'color', values: ['Red'] }] }],
  ])('should separate pages that differ by %s', (_label, override) => {
    expect(
      buildCatalogProductSearchCacheSegments(
        { ...baseFilters, ...override },
        1,
        20,
      ),
    ).not.toEqual(buildCatalogProductSearchCacheSegments(baseFilters, 1, 20));
  });

  it('should separate pages of the same search', () => {
    expect(
      buildCatalogProductSearchCacheSegments(baseFilters, 2, 20),
    ).not.toEqual(buildCatalogProductSearchCacheSegments(baseFilters, 1, 20));
  });

  it('should reuse one key for the same search', () => {
    expect(
      buildCatalogProductSearchCacheSegments(
        { ...baseFilters, attributes: [{ name: 'color', values: ['Red'] }] },
        1,
        20,
      ),
    ).toEqual(
      buildCatalogProductSearchCacheSegments(
        { ...baseFilters, attributes: [{ name: 'color', values: ['Red'] }] },
        1,
        20,
      ),
    );
  });

  it('should not collide with a category page carrying the same filters', () => {
    expect(
      buildCatalogProductSearchCacheSegments(baseFilters, 1, 20),
    ).not.toEqual(
      buildCatalogProductsCacheSegments(
        { shopId: 'shop-id', categoryId: 'ocean tee' },
        1,
        20,
      ),
    );
  });
});

describe('buildCatalogSearchFiltersCacheSegments', () => {
  it('should keep the user input out of the key', () => {
    const segments = buildCatalogSearchFiltersCacheSegments('ocean tee');

    expect(segments[0]).toBe('filters-search');
    expect(segments[1]).toMatch(/^[0-9a-f]{40}$/);
  });

  it('should separate different terms', () => {
    expect(buildCatalogSearchFiltersCacheSegments('ocean')).not.toEqual(
      buildCatalogSearchFiltersCacheSegments('tee'),
    );
  });

  it('should reuse one key for the same term', () => {
    expect(buildCatalogSearchFiltersCacheSegments('ocean')).toEqual(
      buildCatalogSearchFiltersCacheSegments('ocean'),
    );
  });

  it('should not collide with the suggestions of the same term', () => {
    expect(buildCatalogSearchFiltersCacheSegments('ocean')).not.toEqual(
      buildProductSearchCacheSegments('ocean'),
    );
  });
});

describe('buildProductSearchCacheSegments', () => {
  it('should keep the user input out of the key', () => {
    const segments = buildProductSearchCacheSegments('ocean tee');

    expect(segments[0]).toBe('search');
    expect(segments[1]).toMatch(/^[0-9a-f]{40}$/);
  });

  it('should separate different terms', () => {
    expect(buildProductSearchCacheSegments('ocean')).not.toEqual(
      buildProductSearchCacheSegments('tee'),
    );
  });

  it('should reuse one key for the same term', () => {
    expect(buildProductSearchCacheSegments('ocean')).toEqual(
      buildProductSearchCacheSegments('ocean'),
    );
  });
});
