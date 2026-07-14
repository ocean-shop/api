import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryFilters } from '../../models/category.models';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async findAllPaginated(
    filters: CategoryFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Category[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('category')
      .orderBy('category.createdAt', 'DESC')
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

  async findById(id: string): Promise<Category> {
    const category = await this.repository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findOneById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByShopIdAndSlug(
    shopId: string,
    slug: string,
  ): Promise<Category | null> {
    return this.repository.findOne({ where: { shopId, slug } });
  }

  create(payload: Partial<Category>): Category {
    return this.repository.create(payload);
  }

  async save(category: Category): Promise<Category> {
    return this.repository.save(category);
  }

  async remove(category: Category): Promise<Category> {
    return this.repository.remove(category);
  }
}
