import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../entities/category.entity';
import { CategoryFilters } from '../../../models/category.models';
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
}
