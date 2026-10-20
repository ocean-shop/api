import { BadRequestException, Injectable } from '@nestjs/common';
import { CacheService } from '../../../../core/cache/cache.service';
import { POSTGRES_ERROR_CODES } from '../../../../core/db/constants/postgres-error.constants';
import { matchesQueryFailedError } from '../../../../core/db/helpers/query-failed-error.helpers';
import { ATTRIBUTE_DUPLICATE_CONSTRAINTS } from '../../constants/attribute-constraint.constants';
import { ATTRIBUTE_MESSAGES } from '../../constants/attribute-messages.constants';
import { CreateAttributeDto } from '../../dto/attributes/create-attribute.dto';
import { ListAttributesQueryDto } from '../../dto/attributes/list-attributes-query.dto';
import { Attribute } from '../../entities/attribute.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response.helpers';
import { AttributeListResponse } from '../../models/attribute.models';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributeRepository: AttributeRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getAllAttributes(
    query: ListAttributesQueryDto,
  ): Promise<AttributeListResponse> {
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } = await this.attributeRepository.findAllPaginated(
      query.name,
      query.shopId,
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
  }

  async createAttribute(dto: CreateAttributeDto): Promise<Attribute> {
    const attribute = this.attributeRepository.create({
      shopId: dto.shopId,
      name: dto.name,
      value: dto.value,
    });

    try {
      const saved = await this.attributeRepository.save(attribute);
      await this.cacheService.invalidate(dto.shopId);
      return saved;
    } catch (error) {
      if (this.isDuplicateAttributeError(error)) {
        throw new BadRequestException(ATTRIBUTE_MESSAGES.DUPLICATE);
      }

      throw error;
    }
  }

  async removeAttribute(id: string): Promise<MessageResponse> {
    const attribute = await this.attributeRepository.findById(id);
    await this.attributeRepository.remove(attribute);
    await this.cacheService.invalidate(attribute.shopId);
    return { message: ATTRIBUTE_MESSAGES.REMOVED };
  }

  private isDuplicateAttributeError(error: unknown): boolean {
    return matchesQueryFailedError(error, {
      code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
      constraintIn: ATTRIBUTE_DUPLICATE_CONSTRAINTS,
    });
  }
}
