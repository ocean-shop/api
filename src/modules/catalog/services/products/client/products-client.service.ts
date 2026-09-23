import { BadRequestException, Injectable } from '@nestjs/common';
import { ListCatalogProductsQueryDto } from '../../../dto/products/list-catalog-products-query.dto';
import {
  resolvePagination,
  toListResponse,
} from '../../../helpers/list-response.helpers';
import {
  CatalogFilter,
  ProductListResponse,
} from '../../../models/product.models';
import { AttributeRepository } from '../../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../../repositories/category/admin/category.repository';
import { ProductClientRepository } from '../../../repositories/product/client/product-client.repository';

@Injectable()
export class ProductsClientService {
  constructor(
    private readonly productClientRepository: ProductClientRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly attributeRepository: AttributeRepository,
  ) {}

  async listCatalogProducts(
    categoryId: string,
    query: ListCatalogProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.categoryRepository.findById(categoryId);
    this.assertPriceRangeValid(query.priceFrom, query.priceTo);

    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.productClientRepository.findCatalogPaginated(
        {
          categoryId,
          attributes: query.attributes,
          priceFrom: query.priceFrom,
          priceTo: query.priceTo,
          available: query.available,
          sort: query.sort,
        },
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }

  async getFiltersByCategoryId(categoryId: string): Promise<CatalogFilter[]> {
    await this.categoryRepository.findById(categoryId);

    const options =
      await this.attributeRepository.findCategoryFilterOptions(categoryId);

    return this.toCatalogFilters(options);
  }

  private toCatalogFilters(
    options: Array<{ name: string; value: string }>,
  ): CatalogFilter[] {
    const valuesByName = new Map<string, string[]>();

    for (const { name, value } of options) {
      const values = valuesByName.get(name);

      if (values) {
        values.push(value);
        continue;
      }

      valuesByName.set(name, [value]);
    }

    return Array.from(valuesByName, ([name, values]) => ({ name, values }));
  }

  private assertPriceRangeValid(priceFrom?: number, priceTo?: number): void {
    if (
      priceFrom !== undefined &&
      priceTo !== undefined &&
      priceFrom > priceTo
    ) {
      throw new BadRequestException(
        'priceFrom має бути меншим або дорівнювати priceTo',
      );
    }
  }
}
