import {
  CatalogProductFilters,
  CatalogProductSort,
} from '../models/product.models';
import { buildCatalogProductsCacheSegments } from './catalog-cache.helpers';

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
