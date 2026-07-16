import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreateAttributeDto } from '../../dto/create-attribute.dto';
import { Attribute } from '../../entities/attribute.entity';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';

@Injectable()
export class AttributesService {
  private readonly duplicateConstraintNames = [
    'attribute_types_shop_id_name_value_key',
  ];

  constructor(private readonly attributeRepository: AttributeRepository) {}

  async getAllAttributes(): Promise<Attribute[]> {
    return this.attributeRepository.findAll();
  }

  async createAttribute(dto: CreateAttributeDto): Promise<Attribute> {
    const attribute = this.attributeRepository.create({
      shopId: dto.shopId,
      name: dto.name,
      value: dto.value,
    });

    try {
      return await this.attributeRepository.save(attribute);
    } catch (error) {
      if (this.isDuplicateAttributeError(error)) {
        throw new BadRequestException(
          'Attribute with this name and value already exists for this shop',
        );
      }

      throw error;
    }
  }

  async removeAttribute(id: string): Promise<{ message: string }> {
    const attribute = await this.attributeRepository.findById(id);
    await this.attributeRepository.remove(attribute);
    return { message: 'Attribute removed successfully' };
  }

  private isDuplicateAttributeError(error: unknown): boolean {
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
      this.duplicateConstraintNames.includes(databaseError.constraint)
    );
  }
}
