import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../entities/category.entity';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { SEARCH_MATCHED_CATEGORY_CONDITION } from '../../../constants/product-query.constants';
import { escapeLikeWildcards } from '../../../helpers/catalog-query.helpers';
import {
  CatalogCategoryOption,
  CategoryFilters,
} from '../../../models/category.models';
import { CategoryQueryRepository } from '../common/category-query.repository';

@Injectable()
export class CategoryClientRepository extends CategoryQueryRepository {
  constructor(
    @InjectRepository(Category)
    repository: Repository<Category>,
  ) {
    super(repository);
  }

  async findAllPaginated(
    filters: CategoryFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Category[]; total: number }> {
    return this.findPaginated(filters, skip, take);
  }

  async findSubCategories(
    parentId: string,
    shopId?: string,
  ): Promise<Category[]> {
    return this.findByParentId(parentId, shopId);
  }

  /**
   * The categories a search can be narrowed to: every category of the shop that
   * holds at least one active product whose name the term matches.
   *
   * Only the categories the matched products are assigned to, not their
   * ancestors: picking one leads to `by-category/{categoryId}`, which already
   * covers the whole subtree, so an ancestor would list products the search did
   * not match.
   *
   * Deliberately independent of the attribute and price filters the listing
   * applies, exactly like the attribute filter options: the entries describe
   * what the term can be narrowed to, so they must not disappear as the user
   * narrows.
   */
  async findSearchCategories(
    shopId: string,
    term: string,
  ): Promise<CatalogCategoryOption[]> {
    return this.repository
      .createQueryBuilder('category')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('category.slug', 'slug')
      .addSelect('category.parentId', 'parentId')
      .where('category.shopId = :shopId', { shopId })
      .andWhere(SEARCH_MATCHED_CATEGORY_CONDITION, {
        shopId,
        status: ProductStatus.ACTIVE,
        term: escapeLikeWildcards(term),
      })
      .orderBy('category.sort', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getRawMany<CatalogCategoryOption>();
  }
}
