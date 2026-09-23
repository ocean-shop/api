import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CatalogProductSort } from '../../models/product.models';
import { ListCatalogProductsQueryDto } from './list-catalog-products-query.dto';

const toDto = (query: Record<string, unknown>): ListCatalogProductsQueryDto =>
  plainToInstance(ListCatalogProductsQueryDto, query);

describe('ListCatalogProductsQueryDto', () => {
  it('should apply pagination defaults', () => {
    const dto = toDto({});

    expect(validateSync(dto)).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.attributes).toBeUndefined();
  });

  it('should parse attribute groups from a single parameter', () => {
    const dto = toDto({ attributes: 'color:Red,Blue;screen:6' });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.attributes).toEqual([
      { name: 'color', values: ['Red', 'Blue'] },
      { name: 'screen', values: ['6'] },
    ]);
  });

  it('should merge repeated parameters of the same attribute', () => {
    const dto = toDto({ attributes: ['color:Red', 'color:Blue,Red'] });

    expect(dto.attributes).toEqual([
      { name: 'color', values: ['Red', 'Blue'] },
    ]);
  });

  it('should drop malformed attribute groups', () => {
    const dto = toDto({ attributes: ['color', ':Red', 'screen:', ' '] });

    expect(dto.attributes).toBeUndefined();
  });

  it('should parse the remaining catalog filters', () => {
    const dto = toDto({
      page: '2',
      limit: '10',
      priceFrom: '60',
      priceTo: '6000',
      available: 'false',
      sort: CatalogProductSort.EXPENSIVE,
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto).toMatchObject({
      page: 2,
      limit: 10,
      priceFrom: 60,
      priceTo: 6000,
      available: false,
      sort: CatalogProductSort.EXPENSIVE,
    });
  });

  it('should reject unsupported values', () => {
    expect(validateSync(toDto({ available: 'yes' }))).not.toEqual([]);
    expect(validateSync(toDto({ sort: 'cheapest' }))).not.toEqual([]);
    expect(validateSync(toDto({ priceFrom: '-1' }))).not.toEqual([]);
  });
});
