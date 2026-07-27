import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PAGINATION_MAX } from '../../constants/pagination.constants';
import { CreateVariationTypeDto } from '../../dto/create-variation-type.dto';
import { ListVariationTypesQueryDto } from '../../dto/list-variation-types-query.dto';
import { UpdateVariationTypeDto } from '../../dto/update-variation-type.dto';
import { VariationType } from '../../entities/variation-type.entity';
import { VariationTypeListResponse } from '../../models/variation-type.models';
import { VariationTypeRepository } from '../../repositories/variation-type/variation-type.repository';

@Injectable()
export class VariationTypesService {
  private readonly duplicateNameValueConstraintNames = [
    'uq_variation_types_name_value',
  ];

  constructor(
    private readonly variationTypeRepository: VariationTypeRepository,
  ) {}

  async listVariationTypes(
    query: ListVariationTypesQueryDto,
  ): Promise<VariationTypeListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;
    const filters = {
      ...(query.name ? { name: query.name } : {}),
      ...(query.value ? { value: query.value } : {}),
    };

    const { items, total } =
      await this.variationTypeRepository.findAllPaginated(filters, skip, limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async createVariationType(
    dto: CreateVariationTypeDto,
  ): Promise<VariationType> {
    await this.ensureNameAndValueUnique(dto.name, dto.value);

    const variationType = this.variationTypeRepository.create({
      name: dto.name,
      value: dto.value,
    });

    return this.saveVariationType(variationType);
  }

  async updateVariationType(
    id: string,
    dto: UpdateVariationTypeDto,
  ): Promise<VariationType> {
    const variationType = await this.variationTypeRepository.findById(id);

    const nextName = dto.name ?? variationType.name;
    const nextValue = dto.value ?? variationType.value;
    const shouldValidateUniqueness =
      nextName !== variationType.name || nextValue !== variationType.value;

    if (shouldValidateUniqueness) {
      await this.ensureNameAndValueUnique(nextName, nextValue, id);
    }

    if (dto.name !== undefined) {
      variationType.name = dto.name;
    }
    if (dto.value !== undefined) {
      variationType.value = dto.value;
    }

    return this.saveVariationType(variationType);
  }

  async removeVariationType(id: string): Promise<{ message: string }> {
    const variationType = await this.variationTypeRepository.findById(id);
    await this.variationTypeRepository.remove(variationType);
    return { message: 'Variation type removed successfully' };
  }

  private async ensureNameAndValueUnique(
    name: VariationType['name'],
    value: string,
    excludeVariationTypeId?: string,
  ): Promise<void> {
    const existing = await this.variationTypeRepository.findByNameAndValue(
      name,
      value,
    );

    if (existing && existing.id !== excludeVariationTypeId) {
      throw new BadRequestException(
        'Variation type with this name and value already exists',
      );
    }
  }

  private async saveVariationType(
    variationType: VariationType,
  ): Promise<VariationType> {
    try {
      return await this.variationTypeRepository.save(variationType);
    } catch (error) {
      if (this.isDuplicateNameValueError(error)) {
        throw new BadRequestException(
          'Variation type with this name and value already exists',
        );
      }

      throw error;
    }
  }

  private isDuplicateNameValueError(error: unknown): boolean {
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
      this.duplicateNameValueConstraintNames.includes(databaseError.constraint)
    );
  }
}
