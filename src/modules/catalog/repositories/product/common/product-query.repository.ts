import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../../../entities/product.entity';
import {
  ProductOrdering,
  ProductSortBy,
  ProductSortOrder,
} from '../../../models/product.models';

export abstract class ProductQueryRepository {
  protected constructor(protected readonly repository: Repository<Product>) {}

  protected async findPaginatedWithRelations(
    applyFilters: (query: SelectQueryBuilder<Product>) => void,
    skip: number,
    take: number,
    orderings?: ProductOrdering[],
  ): Promise<{ items: Product[]; total: number }> {
    const baseQuery = this.buildBasePaginatedQuery();
    applyFilters(baseQuery);

    const total = await this.countPaginatedResults(baseQuery);
    const ids = await this.findPageIds(baseQuery, skip, take, orderings);
    if (ids.length === 0) {
      return { items: [], total };
    }

    return {
      items: await this.findProductsWithRelationsInOrder(ids),
      total,
    };
  }

  protected buildBasePaginatedQuery(): SelectQueryBuilder<Product> {
    return this.repository.createQueryBuilder('product').distinct(true);
  }

  protected async countPaginatedResults(
    query: SelectQueryBuilder<Product>,
  ): Promise<number> {
    return query.clone().getCount();
  }

  protected async findPageIds(
    query: SelectQueryBuilder<Product>,
    skip: number,
    take: number,
    orderings?: ProductOrdering[],
  ): Promise<string[]> {
    const pageQuery = query.clone().select('product.id', 'id');

    (orderings ?? this.resolveSortOptions()).forEach((ordering, index) => {
      pageQuery.addSelect(ordering.expression, `sortValue${index}`);

      if (index === 0) {
        pageQuery.orderBy(ordering.expression, ordering.direction);
        return;
      }

      pageQuery.addOrderBy(ordering.expression, ordering.direction);
    });

    const idRows = await pageQuery
      .addOrderBy('product.id', 'ASC')
      .offset(skip)
      .limit(take)
      .getRawMany<{ id: string }>();

    return idRows.map((row) => row.id);
  }

  protected resolveSortOptions(
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): ProductOrdering[] {
    return [
      {
        expression:
          sortBy === ProductSortBy.NAME ? 'product.name' : 'product.createdAt',
        direction: sortOrder === ProductSortOrder.ASC ? 'ASC' : 'DESC',
      },
    ];
  }

  protected async findProductsWithRelationsInOrder(
    ids: string[],
  ): Promise<Product[]> {
    const items = await this.repository.find({
      where: { id: In(ids) },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
      },
      order: { images: { sort: 'ASC' } },
    });

    const itemsById = new Map(items.map((item) => [item.id, item]));

    return ids
      .map((id) => itemsById.get(id))
      .filter((item): item is Product => item !== undefined);
  }
}
