import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { POPULAR_PRODUCTS_LIMIT } from '../../../constants/pagination.constants';
import { ListCatalogProductsQueryDto } from '../../../dto/products/list-catalog-products-query.dto';
import { Product } from '../../../entities/product.entity';
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

  async listPopularProducts(shopId?: string): Promise<Product[]> {
    return this.productClientRepository.findPopular(
      POPULAR_PRODUCTS_LIMIT,
      shopId,
    );
  }

  async listCatalogProducts(
    categoryId: string,
    query: ListCatalogProductsQueryDto,
  ): Promise<ProductListResponse> {
    // No category existence check here: it costs a round trip on every catalog
    // request to turn an already empty page into a 404.
    this.assertPriceRangeValid(query.priceFrom, query.priceTo);

    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.productClientRepository.findCatalogPaginated(
        {
          shopId: query.shopId,
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

  async getFiltersByCategoryId(
    categoryId: string,
    shopId: string,
  ): Promise<CatalogFilter[]> {
    const category = await this.categoryRepository.findById(categoryId);

    // A category of another shop is treated as missing rather than forbidden:
    // the storefront has no business knowing it exists.
    if (category.shopId !== shopId) {
      throw new NotFoundException('Категорію не знайдено');
    }

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
