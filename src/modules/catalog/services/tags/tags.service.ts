import { BadRequestException, Injectable } from '@nestjs/common';
import { matchesQueryFailedError } from '../../../../core/db/helpers/query-failed-error.helpers';
import { CreateTagDto } from '../../dto/tags/create-tag.dto';
import { ListTagsQueryDto } from '../../dto/tags/list-tags-query.dto';
import { UpdateTagDto } from '../../dto/tags/update-tag.dto';
import { Tag } from '../../entities/tag.entity';
import { TagListResponse } from '../../models/tag.models';
import { TagRepository } from '../../repositories/tag/tag.repository';
import { PAGINATION_MAX } from '../../constants/pagination.constants';

@Injectable()
export class TagsService {
  private readonly duplicateNameConstraintNames = ['tags_shop_id_name_key'];

  constructor(private readonly tagRepository: TagRepository) {}

  async listTags(query: ListTagsQueryDto): Promise<TagListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;
    const filters = {
      ...(query.shopId ? { shopId: query.shopId } : {}),
      ...(query.name ? { name: query.name } : {}),
    };

    const { items, total } = await this.tagRepository.findAllPaginated(
      filters,
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

  async getTagById(id: string): Promise<Tag> {
    return this.tagRepository.findById(id);
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    await this.ensureNameUniqueInShop(dto.shopId, dto.name);

    const tag = this.tagRepository.create({
      shopId: dto.shopId,
      name: dto.name,
    });

    return this.saveTag(tag);
  }

  async updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);

    if (dto.name !== undefined && dto.name !== tag.name) {
      await this.ensureNameUniqueInShop(tag.shopId, dto.name, id);
      tag.name = dto.name;
    }

    return this.saveTag(tag);
  }

  async removeTag(id: string): Promise<{ message: string }> {
    const tag = await this.tagRepository.findById(id);
    await this.tagRepository.remove(tag);
    return { message: 'Тег успішно видалено' };
  }

  private async ensureNameUniqueInShop(
    shopId: string,
    name: string,
    excludeTagId?: string,
  ): Promise<void> {
    const existing = await this.tagRepository.findByShopIdAndName(shopId, name);

    if (existing && existing.id !== excludeTagId) {
      throw new BadRequestException('Назва тегу вже існує для цього магазину');
    }
  }

  private async saveTag(tag: Tag): Promise<Tag> {
    try {
      return await this.tagRepository.save(tag);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new BadRequestException(
          'Назва тегу вже існує для цього магазину',
        );
      }

      throw error;
    }
  }

  private isDuplicateNameError(error: unknown): boolean {
    return matchesQueryFailedError(error, {
      code: '23505',
      constraintIn: this.duplicateNameConstraintNames,
    });
  }
}
