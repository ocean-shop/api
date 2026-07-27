import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariationType } from '../../entities/variation-type.entity';
import { VariationTypeFilters } from '../../models/variation-type.models';

@Injectable()
export class VariationTypeRepository {
  constructor(
    @InjectRepository(VariationType)
    private readonly repository: Repository<VariationType>,
  ) {}

  async findAllPaginated(
    filters: VariationTypeFilters,
    skip: number,
    take: number,
  ): Promise<{ items: VariationType[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('variationType')
      .orderBy('variationType.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (filters.name) {
      query.andWhere('variationType.name = :name', { name: filters.name });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<VariationType> {
    const variationType = await this.repository.findOne({ where: { id } });

    if (!variationType) {
      throw new NotFoundException('Variation type not found');
    }

    return variationType;
  }

  async findByName(name: VariationType['name']): Promise<VariationType | null> {
    return this.repository.findOne({ where: { name } });
  }

  create(payload: Partial<VariationType>): VariationType {
    return this.repository.create(payload);
  }

  async save(variationType: VariationType): Promise<VariationType> {
    return this.repository.save(variationType);
  }

  async remove(variationType: VariationType): Promise<VariationType> {
    return this.repository.remove(variationType);
  }
}
