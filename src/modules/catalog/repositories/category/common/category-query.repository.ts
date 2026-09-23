import { Repository } from 'typeorm';
import { Category } from '../../../entities/category.entity';
import { CategoryFilters } from '../../../models/category.models';

export abstract class CategoryQueryRepository {
  protected constructor(protected readonly repository: Repository<Category>) {}

  protected async findPaginated(
    filters: CategoryFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Category[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('category')
      .orderBy('category.sort', 'ASC')
      .addOrderBy('category.createdAt', 'ASC')
      .skip(skip)
      .take(take);

    if (filters.shopId) {
      query.andWhere('category.shopId = :shopId', { shopId: filters.shopId });
    }

    if (filters.parentId) {
      query.andWhere('category.parentId = :parentId', {
        parentId: filters.parentId,
      });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }
}
