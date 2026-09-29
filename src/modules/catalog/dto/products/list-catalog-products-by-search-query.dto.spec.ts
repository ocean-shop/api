import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PRODUCT_SEARCH_TERM_MAX_LENGTH } from '../../constants/pagination.constants';
import { CatalogProductSort } from '../../models/product.models';
import { ListCatalogProductsBySearchQueryDto } from './list-catalog-products-by-search-query.dto';

const SHOP_ID = '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b';

const toDto = (
  query: Record<string, unknown>,
): ListCatalogProductsBySearchQueryDto =>
  plainToInstance(ListCatalogProductsBySearchQueryDto, {
    shopId: SHOP_ID,
    query: 'ocean tee',
    ...query,
  });

describe('ListCatalogProductsBySearchQueryDto', () => {
  it('should apply pagination defaults', () => {
    const dto = toDto({});

    expect(validateSync(dto)).toEqual([]);
    expect(dto.shopId).toBe(SHOP_ID);
    expect(dto.query).toBe('ocean tee');
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sort).toBeUndefined();
  });

  it('should require a search string', () => {
    expect(validateSync(toDto({ query: undefined }))).not.toEqual([]);
    expect(validateSync(toDto({ query: '   ' }))).not.toEqual([]);
    expect(
      validateSync(
        toDto({ query: 'a'.repeat(PRODUCT_SEARCH_TERM_MAX_LENGTH + 1) }),
      ),
    ).not.toEqual([]);
  });

  it('should normalize the search string', () => {
    const dto = toDto({ query: '  Ocean   TEE ' });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.query).toBe('ocean tee');
  });

  it('should inherit the catalog filters, sorting and pagination', () => {
    const dto = toDto({
      page: '2',
      limit: '10',
      attributes: 'color:Red,Blue;screen:6',
      priceFrom: '60',
      priceTo: '6000',
      available: 'false',
      sort: CatalogProductSort.EXPENSIVE,
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto).toMatchObject({
      page: 2,
      limit: 10,
      attributes: [
        { name: 'color', values: ['Red', 'Blue'] },
        { name: 'screen', values: ['6'] },
      ],
      priceFrom: 60,
      priceTo: 6000,
      available: false,
      sort: CatalogProductSort.EXPENSIVE,
    });
  });

  it('should reject unsupported values', () => {
    expect(validateSync(toDto({ shopId: 'not-a-uuid' }))).not.toEqual([]);
    expect(validateSync(toDto({ sort: 'cheapest' }))).not.toEqual([]);
    expect(validateSync(toDto({ limit: '1000' }))).not.toEqual([]);
  });
});
