import { BadRequestException, Injectable } from '@nestjs/common';
import { POSTGRES_ERROR_CODES } from '../../../../core/db/constants/postgres-error.constants';
import { matchesQueryFailedError } from '../../../../core/db/helpers/query-failed-error.helpers';
import { TAG_DUPLICATE_NAME_CONSTRAINTS } from '../../constants/tag-constraint.constants';
import { TAG_MESSAGES } from '../../constants/tag-messages.constants';
import { CreateTagDto } from '../../dto/tags/create-tag.dto';
import { ListTagsQueryDto } from '../../dto/tags/list-tags-query.dto';
import { UpdateTagDto } from '../../dto/tags/update-tag.dto';
import { Tag } from '../../entities/tag.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response.helpers';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { TagListResponse } from '../../models/tag.models';
import { TagRepository } from '../../repositories/tag/tag.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagRepository: TagRepository) {}

  async listTags(query: ListTagsQueryDto): Promise<TagListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const filters = {
      ...(query.shopId ? { shopId: query.shopId } : {}),
      ...(query.name ? { name: query.name } : {}),
    };

    const { items, total } = await this.tagRepository.findAllPaginated(
      filters,
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
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

  async removeTag(id: string): Promise<MessageResponse> {
    const tag = await this.tagRepository.findById(id);
    await this.tagRepository.remove(tag);
    return { message: TAG_MESSAGES.REMOVED };
  }

  private async ensureNameUniqueInShop(
    shopId: string,
    name: string,
    excludeTagId?: string,
  ): Promise<void> {
    const existing = await this.tagRepository.findByShopIdAndName(shopId, name);

    if (existing && existing.id !== excludeTagId) {
      throw new BadRequestException(TAG_MESSAGES.DUPLICATE_NAME);
    }
  }

  private async saveTag(tag: Tag): Promise<Tag> {
    try {
      return await this.tagRepository.save(tag);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new BadRequestException(TAG_MESSAGES.DUPLICATE_NAME);
      }

      throw error;
    }
  }

  private isDuplicateNameError(error: unknown): boolean {
    return matchesQueryFailedError(error, {
      code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
      constraintIn: TAG_DUPLICATE_NAME_CONSTRAINTS,
    });
  }
}
