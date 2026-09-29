import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import { CACHE_SCOPE_ALL } from '../../../../../core/cache/constants/cache.constants';
import {
  CATALOG_FILTERS_CACHE_TTL_SECONDS,
  CATALOG_PRODUCT_CACHE_TTL_SECONDS,
  CATALOG_PRODUCTS_CACHE_TTL_SECONDS,
  POPULAR_PRODUCTS_CACHE_TTL_SECONDS,
  PRODUCT_SEARCH_CACHE_TTL_SECONDS,
} from '../../../constants/catalog-cache.constants';
import {
  POPULAR_PRODUCTS_LIMIT,
  PRODUCT_SEARCH_LIMIT,
} from '../../../constants/pagination.constants';
import { ListCatalogProductsBySearchQueryDto } from '../../../dto/products/list-catalog-products-by-search-query.dto';
import { ListCatalogProductsQueryDto } from '../../../dto/products/list-catalog-products-query.dto';
import { Product } from '../../../entities/product.entity';
import {
  buildCatalogProductSearchCacheSegments,
  buildCatalogProductsCacheSegments,
  buildProductSearchCacheSegments,
} from '../../../helpers/catalog-cache.helpers';
import {
  resolvePagination,
  toListResponse,
} from '../../../helpers/list-response.helpers';
import {
  CatalogFilter,
  CatalogProductFilters,
  CatalogProductSearchFilters,
  ProductListResponse,
  ProductSearchResponse,
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
    private readonly cacheService: CacheService,
  ) {}

  async listPopularProducts(shopId?: string): Promise<Product[]> {
    return this.cacheService.wrap(
      {
        scope: shopId ?? CACHE_SCOPE_ALL,
        segments: ['popular', shopId ?? CACHE_SCOPE_ALL],
        ttlSeconds: POPULAR_PRODUCTS_CACHE_TTL_SECONDS,
      },
      () =>
        this.productClientRepository.findPopular(
          POPULAR_PRODUCTS_LIMIT,
          shopId,
        ),
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
    const filters: CatalogProductFilters = {
      shopId: query.shopId,
      categoryId,
      attributes: query.attributes,
      priceFrom: query.priceFrom,
      priceTo: query.priceTo,
      available: query.available,
      sort: query.sort,
    };

    // Caching the assembled page skips seven round trips: the count, the page
    // of ids, and the five queries that load the product relations.
    return this.cacheService.wrap(
      {
        scope: query.shopId,
        segments: buildCatalogProductsCacheSegments(filters, page, limit),
        ttlSeconds: CATALOG_PRODUCTS_CACHE_TTL_SECONDS,
      },
      async () => {
        const { items, total } =
          await this.productClientRepository.findCatalogPaginated(
            filters,
            skip,
            limit,
          );

        return toListResponse(items, total, page, limit);
      },
    );
  }

  /**
   * The catalog page of a search: the same filters, sorting and pagination as
   * `listCatalogProducts`, with the term selecting the products.
   */
  async listCatalogProductsBySearch(
    query: ListCatalogProductsBySearchQueryDto,
  ): Promise<ProductListResponse> {
    this.assertPriceRangeValid(query.priceFrom, query.priceTo);

    const { page, limit, skip } = resolvePagination(query);
    const filters: CatalogProductSearchFilters = {
      shopId: query.shopId,
      term: query.query,
      attributes: query.attributes,
      priceFrom: query.priceFrom,
      priceTo: query.priceTo,
      available: query.available,
      sort: query.sort,
    };

    // Search terms are typed character by character, so the same page is asked
    // for repeatedly within seconds: caching it keeps those repeats off Postgres.
    return this.cacheService.wrap(
      {
        scope: query.shopId,
        segments: buildCatalogProductSearchCacheSegments(filters, page, limit),
        ttlSeconds: CATALOG_PRODUCTS_CACHE_TTL_SECONDS,
      },
      async () => {
        const { items, total } =
          await this.productClientRepository.findSearchPaginated(
            filters,
            skip,
            limit,
          );

        return toListResponse(items, total, page, limit);
      },
    );
  }

  /**
   * The term arrives normalized from the DTO, so the cache key is shared by
   * every spelling of the same search and the suggestions of a term that is
   * being typed again are served without touching Postgres.
   */
  async searchProducts(
    shopId: string,
    term: string,
  ): Promise<ProductSearchResponse> {
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: buildProductSearchCacheSegments(term),
        ttlSeconds: PRODUCT_SEARCH_CACHE_TTL_SECONDS,
      },
      () =>
        this.productClientRepository.searchActive(
          shopId,
          term,
          PRODUCT_SEARCH_LIMIT,
        ),
    );
  }

  async getProductById(productId: string, shopId: string): Promise<Product> {
    // The lookup runs inside the cached section on purpose: only a matching
    // pair ever gets stored, so a foreign product still hits the database and
    // still 404s.
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: ['product', productId],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      async () => {
        const product =
          await this.productClientRepository.findActiveByShopIdAndId(
            shopId,
            productId,
          );

        // A draft product, or one of another shop, is treated as missing rather
        // than forbidden: the storefront has no business knowing it exists.
        if (!product) {
          throw new NotFoundException('Продукт не знайдено');
        }

        return product;
      },
    );
  }

  async getFiltersByCategoryId(
    categoryId: string,
    shopId: string,
  ): Promise<CatalogFilter[]> {
    // The ownership check runs inside the cached section on purpose: only a
    // matching pair ever gets stored, so a foreign category still hits the
    // database and still 404s.
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: ['filters', categoryId],
        ttlSeconds: CATALOG_FILTERS_CACHE_TTL_SECONDS,
      },
      async () => {
        const category = await this.categoryRepository.findById(categoryId);

        // A category of another shop is treated as missing rather than
        // forbidden: the storefront has no business knowing it exists.
        if (category.shopId !== shopId) {
          throw new NotFoundException('Категорію не знайдено');
        }

        const options =
          await this.attributeRepository.findCategoryFilterOptions(categoryId);

        return this.toCatalogFilters(options);
      },
    );
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
