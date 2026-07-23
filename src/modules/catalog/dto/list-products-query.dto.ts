import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProductStatus } from '../entities/enums/product.enum';
import { ProductSortBy, ProductSortOrder } from '../models/product.models';

export class ListProductsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsUUID()
  readonly shopId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  readonly status?: ProductStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly sku?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  })
  @IsArray()
  @IsUUID('4', { each: true })
  readonly categoryIds?: string[];

  @IsOptional()
  @IsEnum(ProductSortBy)
  readonly sortBy?: ProductSortBy = ProductSortBy.CREATED_AT;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.toLowerCase();
  })
  @IsEnum(ProductSortOrder)
  readonly sortOrder?: ProductSortOrder = ProductSortOrder.DESC;
}
