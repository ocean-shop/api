import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../../../entities/product.entity';
import { ProductStatus } from '../../../entities/enums/product.enum';
import {
  CatalogFilter,
  CatalogProductFilters,
  CatalogProductSort,
  ProductOrdering,
  ProductSearchItem,
  ProductSearchResponse,
} from '../../../models/product.models';
import { CATEGORY_SUBTREE_IDS_SUBQUERY } from '../../../constants/category-query.constants';
import {
  EFFECTIVE_PRICE_EXPRESSION,
  PRODUCT_SEARCH_QUERY,
} from '../../../constants/product-query.constants';
import { escapeLikeWildcards } from '../../../helpers/catalog-query.helpers';
import { ProductQueryRepository } from '../common/product-query.repository';

/** Every row repeats the total, which Postgres returns as a bigint string. */
type ProductSearchRow = ProductSearchItem & { total: string };

@Injectable()
export class ProductClientRepository extends ProductQueryRepository {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }

  async findCatalogPaginated(
    filters: CatalogProductFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.categories', 'category')
          .andWhere(`category.id IN (${CATEGORY_SUBTREE_IDS_SUBQUERY})`, {
            categoryId: filters.categoryId,
          })
          .andWhere('product.shopId = :shopId', { shopId: filters.shopId })
          .andWhere('product.status = :status', {
            status: ProductStatus.ACTIVE,
          });

        if (filters.available !== undefined) {
          query.andWhere('product.available = :available', {
            available: filters.available,
          });
        }

        if (filters.priceFrom !== undefined) {
          query.andWhere(`${EFFECTIVE_PRICE_EXPRESSION} >= :priceFrom`, {
            priceFrom: filters.priceFrom,
          });
        }

        if (filters.priceTo !== undefined) {
          query.andWhere(`${EFFECTIVE_PRICE_EXPRESSION} <= :priceTo`, {
            priceTo: filters.priceTo,
          });
        }

        filters.attributes?.forEach((attribute, index) => {
          this.applyAttributeFilter(query, attribute, index);
        });
      },
      skip,
      take,
      this.resolveCatalogOrderings(filters.sort),
    );
  }

  /**
   * Loads a storefront product page: the product with its images, tags and
   * variations with their images. Only active products of the given shop are
   * visible, so anything else reads as missing.
   */
  async findActiveByShopIdAndId(
    shopId: string,
    productId: string,
  ): Promise<Product | null> {
    const product = await this.repository.findOne({
      where: { id: productId, shopId, status: ProductStatus.ACTIVE },
      relations: {
        tags: true,
        images: true,
        variations: {
          images: true,
        },
      },
      // One query per collection instead of a single multi-join, whose rows
      // multiply out as tags × images × variations × variation images.
      relationLoadStrategy: 'query',
    });

    if (!product) {
      return null;
    }

    // Ordering through `order` would join the collections back into the main
    // query and bring the row multiplication back, so sort them here.
    product.images?.sort((a, b) => a.sort - b.sort);
    product.variations?.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    product.variations?.forEach((variation) =>
      variation.images?.sort((a, b) => a.sort - b.sort),
    );

    return product;
  }

  async findPopular(take: number, shopId?: string): Promise<Product[]> {
    const { items } = await this.findPaginatedWithRelations(
      (query) => {
        query
          .andWhere('product.isPopular = :isPopular', { isPopular: true })
          .andWhere('product.status = :status', {
            status: ProductStatus.ACTIVE,
          });

        if (shopId) {
          query.andWhere('product.shopId = :shopId', { shopId });
        }
      },
      0,
      take,
    );

    return items;
  }

  /**
   * Searches the active products of a shop by name and returns the most
   * relevant ones plus how many products matched in total.
   *
   * Written as one raw statement rather than through the query builder: the
   * count rides along on the rows, and the image and price lookups stay out of
   * the part of the plan that touches every match. See `PRODUCT_SEARCH_QUERY`.
   */
  async searchActive(
    shopId: string,
    term: string,
    take: number,
  ): Promise<ProductSearchResponse> {
    const rows = await this.repository.query<ProductSearchRow[]>(
      PRODUCT_SEARCH_QUERY,
      [shopId, ProductStatus.ACTIVE, escapeLikeWildcards(term), take],
    );

    return {
      total: rows.length > 0 ? Number(rows[0].total) : 0,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        oldPrice: row.oldPrice,
        image: row.image,
      })),
    };
  }

  private applyAttributeFilter(
    query: SelectQueryBuilder<Product>,
    attribute: CatalogFilter,
    index: number,
  ): void {
    const nameParameter = `attributeName${index}`;
    const valuesParameter = `attributeValues${index}`;

    query.andWhere(
      `EXISTS (
        SELECT 1
        FROM attribute_types filtered_attribute
        WHERE filtered_attribute.name = :${nameParameter}
          AND filtered_attribute.value IN (:...${valuesParameter})
          AND (
            EXISTS (
              SELECT 1
              FROM products_attributes product_attribute
              WHERE product_attribute.product_id = product.id
                AND product_attribute.attribute_type_id = filtered_attribute.id
            )
            OR EXISTS (
              SELECT 1
              FROM product_variations filtered_variation
              INNER JOIN variations_attributes variation_attribute
                ON variation_attribute.variation_id = filtered_variation.id
              WHERE filtered_variation.product_id = product.id
                AND variation_attribute.attribute_type_id = filtered_attribute.id
            )
          )
      )`,
      {
        [nameParameter]: attribute.name,
        [valuesParameter]: attribute.values,
      },
    );
  }

  private resolveCatalogOrderings(
    sort?: CatalogProductSort,
  ): ProductOrdering[] {
    switch (sort) {
      case CatalogProductSort.POPULAR:
        return [
          { expression: 'product.isPopular', direction: 'DESC' },
          { expression: 'product.createdAt', direction: 'DESC' },
        ];
      case CatalogProductSort.CHEAPER:
        return [{ expression: EFFECTIVE_PRICE_EXPRESSION, direction: 'ASC' }];
      case CatalogProductSort.EXPENSIVE:
        return [{ expression: EFFECTIVE_PRICE_EXPRESSION, direction: 'DESC' }];
      default:
        return [{ expression: 'product.createdAt', direction: 'DESC' }];
    }
  }
}
