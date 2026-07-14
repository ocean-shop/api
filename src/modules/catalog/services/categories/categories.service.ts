import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryListResponse } from '../../models/category.models';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { ListCategoriesQueryDto } from '../../dto/list-categories-query.dto';

@Injectable()
export class CategoriesService {
  private readonly duplicateSlugConstraintNames = [
    'uq_categories_shop_root_slug',
    'uq_categories_shop_parent_slug',
  ];

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories(
    query: ListCategoriesQueryDto,
  ): Promise<CategoryListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.categoryRepository.findAllPaginated(
      { shopId: query.shopId, parentId: query.parentId },
      skip,
      limit,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.categoryRepository.findById(id);
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    await this.ensureSlugUniqueInShop(dto.shopId, dto.slug);

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOneById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      if (parent.shopId !== dto.shopId) {
        throw new BadRequestException(
          'Parent category belongs to a different shop',
        );
      }
    }

    const category = this.categoryRepository.create({
      shopId: dto.shopId,
      parentId: dto.parentId ?? null,
      name: dto.name,
      slug: dto.slug,
    });

    return this.saveCategory(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (dto.slug !== undefined && dto.slug !== category.slug) {
      await this.ensureSlugUniqueInShop(category.shopId, dto.slug, id);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.categoryRepository.findOneById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      if (parent.shopId !== category.shopId) {
        throw new BadRequestException(
          'Parent category belongs to a different shop',
        );
      }

      category.parentId = dto.parentId;
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.slug !== undefined) {
      category.slug = dto.slug;
    }

    return this.saveCategory(category);
  }

  async removeCategory(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findById(id);
    await this.categoryRepository.remove(category);
    return { message: 'Category removed successfully' };
  }

  private async saveCategory(category: Category): Promise<Category> {
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (this.isDuplicateSlugError(error)) {
        throw new BadRequestException(
          'Category slug already exists for this shop and parent',
        );
      }

      throw error;
    }
  }

  private async ensureSlugUniqueInShop(
    shopId: string,
    slug: string,
    excludeCategoryId?: string,
  ): Promise<void> {
    const existing = await this.categoryRepository.findByShopIdAndSlug(
      shopId,
      slug,
    );

    if (existing && existing.id !== excludeCategoryId) {
      throw new BadRequestException(
        'Category slug already exists for this shop',
      );
    }
  }

  private isDuplicateSlugError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const databaseError = error as QueryFailedError & {
      code?: string;
      constraint?: string;
    };

    return (
      databaseError.code === '23505' &&
      !!databaseError.constraint &&
      this.duplicateSlugConstraintNames.includes(databaseError.constraint)
    );
  }
}
