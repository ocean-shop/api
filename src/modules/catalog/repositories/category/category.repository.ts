import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
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

  async getMaxSort(shopId: string, parentId: string | null): Promise<number> {
    const query = this.repository
      .createQueryBuilder('category')
      .select('MAX(category.sort)', 'max')
      .where('category.shopId = :shopId', { shopId });

    if (parentId === null) {
      query.andWhere('category.parentId IS NULL');
    } else {
      query.andWhere('category.parentId = :parentId', { parentId });
    }

    const result = await query.getRawOne<{ max: string | null }>();
    return result?.max !== null && result?.max !== undefined
      ? Number(result.max)
      : -1;
  }

  async findAdjacentSibling(
    category: Category,
    direction: 'up' | 'down',
  ): Promise<Category | null> {
    const where: Record<string, unknown> = {
      shopId: category.shopId,
      parentId: category.parentId === null ? IsNull() : category.parentId,
      sort:
        direction === 'up' ? LessThan(category.sort) : MoreThan(category.sort),
    };

    return this.repository.findOne({
      where,
      order: {
        sort: direction === 'up' ? 'DESC' : 'ASC',
      },
    });
  }

  async swapSort(category: Category, sibling: Category): Promise<Category> {
    const categorySort = category.sort;
    const siblingSort = sibling.sort;

    return this.repository.manager.transaction(async (manager) => {
      category.sort = siblingSort;
      sibling.sort = categorySort;

      await manager.save([sibling, category]);
      return category;
    });
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
