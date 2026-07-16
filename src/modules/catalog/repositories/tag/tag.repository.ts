import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../entities/tag.entity';
import { TagFilters } from '../../models/tag.models';

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly repository: Repository<Tag>,
  ) {}

  async findAllPaginated(
    filters: TagFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Tag[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('tag')
      .orderBy('tag.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (filters.shopId) {
      query.andWhere('tag.shopId = :shopId', { shopId: filters.shopId });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.repository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findByShopIdAndName(shopId: string, name: string): Promise<Tag | null> {
    return this.repository.findOne({ where: { shopId, name } });
  }

  create(payload: Partial<Tag>): Tag {
    return this.repository.create(payload);
  }

  async save(tag: Tag): Promise<Tag> {
    return this.repository.save(tag);
  }

  async remove(tag: Tag): Promise<Tag> {
    return this.repository.remove(tag);
  }
}
