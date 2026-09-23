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
} from '../../../models/product.models';
import { EFFECTIVE_PRICE_EXPRESSION } from '../../../constants/product-query.constants';
import { ProductQueryRepository } from '../common/product-query.repository';

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
          .andWhere('category.id = :categoryId', {
            categoryId: filters.categoryId,
          })
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
