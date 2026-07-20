import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../../entities/attribute.entity';

@Injectable()
export class AttributeRepository {
  constructor(
    @InjectRepository(Attribute)
    private readonly repository: Repository<Attribute>,
  ) {}

  async findById(id: string): Promise<Attribute> {
    const attribute = await this.repository.findOne({ where: { id } });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }

  async findAllPaginated(
    name: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ items: Attribute[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('attribute')
      .orderBy('attribute.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (name) {
      query.andWhere('attribute.name ILIKE :name', { name: `%${name}%` });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  create(payload: Partial<Attribute>): Attribute {
    return this.repository.create(payload);
  }

  async save(attribute: Attribute): Promise<Attribute> {
    return this.repository.save(attribute);
  }

  async remove(attribute: Attribute): Promise<Attribute> {
    return this.repository.remove(attribute);
  }
}
