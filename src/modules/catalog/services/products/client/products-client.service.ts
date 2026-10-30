import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import { CACHE_SCOPE_ALL } from '../../../../../core/cache/constants/cache.constants';
import { CATEGORY_MESSAGES } from '../../../constants/category-messages.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import {
  CATALOG_CACHE_SEGMENTS,
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
  buildCatalogSearchCategoriesCacheSegments,
  buildCatalogSearchFiltersCacheSegments,
  buildProductSearchCacheSegments,
} from '../../../helpers/catalog-cache/catalog-cache.helpers';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { AttributeFilterOption } from '../../../models/attribute.models';
import { CatalogCategoryOption } from '../../../models/category.models';
import {
  CatalogFilter,
  CatalogProductFilters,
  CatalogProductSearchFilters,
  ProductListResponse,
  ProductSearchListResponse,
  ProductSearchResponse,
  ProductSitemapEntry,
} from '../../../models/product.models';
import { AttributeRepository } from '../../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../../repositories/category/admin/category.repository';
import { CategoryClientRepository } from '../../../repositories/category/client/category-client.repository';
import { ProductClientRepository } from '../../../repositories/product/client/product-client.repository';

@Injectable()
export class ProductsClientService {
  constructor(
    private readonly productClientRepository: ProductClientRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryClientRepository: CategoryClientRepository,
    private readonly attributeRepository: AttributeRepository,
    private readonly cacheService: CacheService,
  ) {}

  async listPopularProducts(shopId?: string): Promise<Product[]> {
    return this.cacheService.wrap(
      {
        scope: shopId ?? CACHE_SCOPE_ALL,
        segments: [CATALOG_CACHE_SEGMENTS.POPULAR, shopId ?? CACHE_SCOPE_ALL],
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
   *
   * The filter panel and the category list ship with the page. A search has no
   * category to ask `getFiltersByCategoryId` about, and what a term can be
   * narrowed to is only known once the term is known, so the storefront would
   * otherwise need two more round trips for every search.
   */
  async listCatalogProductsBySearch(
    query: ListCatalogProductsBySearchQueryDto,
  ): Promise<ProductSearchListResponse> {
    this.assertPriceRangeValid(query.priceFrom, query.priceTo);

    const { page, limit, skip } = resolvePagination(query);
    const filters: CatalogProductSearchFilters = {
      shopId: query.shopId,
      term: query.query,
      categoryIds: query.categoryIds,
      attributes: query.attributes,
      priceFrom: query.priceFrom,
      priceTo: query.priceTo,
      available: query.available,
      sort: query.sort,
    };

    // Three independent lookups, so they go out together: the page varies by
    // every filter while the available filters and categories vary by the term
    // alone.
    const [listResponse, availableFilters, availableCategories] =
      await Promise.all([
        this.loadSearchPage(filters, page, limit, skip),
        this.getFiltersBySearch(filters.shopId, filters.term),
        this.getCategoriesBySearch(filters.shopId, filters.term),
      ]);

    return {
      ...listResponse,
      filters: availableFilters,
      categories: availableCategories,
    };
  }

  private async loadSearchPage(
    filters: CatalogProductSearchFilters,
    page: number,
    limit: number,
    skip: number,
  ): Promise<ProductListResponse> {
    // Search terms are typed character by character, so the same page is asked
    // for repeatedly within seconds: caching it keeps those repeats off Postgres.
    return this.cacheService.wrap(
      {
        scope: filters.shopId,
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
   * The filters a search can be narrowed by: every attribute of the active
   * products the term matches.
   *
   * Cached apart from the page, under the term alone: the options are the same
   * for every page, sort and filter combination of that term, so paging or
   * ticking a box hits one entry instead of recounting the attributes.
   */
  private async getFiltersBySearch(
    shopId: string,
    term: string,
  ): Promise<CatalogFilter[]> {
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: buildCatalogSearchFiltersCacheSegments(term),
        ttlSeconds: CATALOG_FILTERS_CACHE_TTL_SECONDS,
      },
      async () => {
        const options = await this.attributeRepository.findSearchFilterOptions(
          shopId,
          term,
        );

        return this.toCatalogFilters(options);
      },
    );
  }

  /**
   * The categories a search can be narrowed to: every category holding an
   * active product the term matches.
   *
   * Cached apart from the page and the filters, under the term alone, for the
   * same reason as the filters: the categories are the same for every page,
   * sort and filter combination of that term.
   */
  private async getCategoriesBySearch(
    shopId: string,
    term: string,
  ): Promise<CatalogCategoryOption[]> {
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: buildCatalogSearchCategoriesCacheSegments(term),
        ttlSeconds: CATALOG_FILTERS_CACHE_TTL_SECONDS,
      },
      () => this.categoryClientRepository.findSearchCategories(shopId, term),
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
        segments: [CATALOG_CACHE_SEGMENTS.PRODUCT, productId],
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
          throw new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND);
        }

        return product;
      },
    );
  }

  async getProductBySlug(slug: string, shopId: string): Promise<Product> {
    // Same contract as `getProductById`: only a matching pair is ever cached.
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: [CATALOG_CACHE_SEGMENTS.PRODUCT_SLUG, slug],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      async () => {
        const product =
          await this.productClientRepository.findActiveByShopIdAndSlug(
            shopId,
            slug,
          );

        if (!product) {
          throw new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND);
        }

        return product;
      },
    );
  }

  /** Crawlers ask for the sitemap rarely, but each ask reads the whole catalog. */
  async listSitemapEntries(shopId: string): Promise<ProductSitemapEntry[]> {
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: [CATALOG_CACHE_SEGMENTS.SITEMAP],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      () => this.productClientRepository.findActiveSitemapEntries(shopId),
    );
  }

  async getMainBannerProduct(shopId: string): Promise<Product> {
    // Like the product page, a missing banner throws inside the cached section
    // and is never stored, so flagging a product shows up on the next request.
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: [CATALOG_CACHE_SEGMENTS.MAIN_BANNER],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      async () => {
        const product =
          await this.productClientRepository.findActiveMainBannerByShopId(
            shopId,
          );

        if (!product) {
          throw new NotFoundException(PRODUCT_MESSAGES.MAIN_BANNER_NOT_FOUND);
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
        segments: [CATALOG_CACHE_SEGMENTS.FILTERS, categoryId],
        ttlSeconds: CATALOG_FILTERS_CACHE_TTL_SECONDS,
      },
      async () => {
        const category = await this.categoryRepository.findById(categoryId);

        // A category of another shop is treated as missing rather than
        // forbidden: the storefront has no business knowing it exists.
        if (category.shopId !== shopId) {
          throw new NotFoundException(CATEGORY_MESSAGES.NOT_FOUND);
        }

        const options =
          await this.attributeRepository.findCategoryFilterOptions(categoryId);

        return this.toCatalogFilters(options);
      },
    );
  }

  private toCatalogFilters(options: AttributeFilterOption[]): CatalogFilter[] {
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
      throw new BadRequestException(PRODUCT_MESSAGES.INVALID_PRICE_RANGE);
    }
  }
}
