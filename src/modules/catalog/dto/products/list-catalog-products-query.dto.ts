import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  parseAttributeFilters,
  parseBoolean,
} from '../../helpers/catalog-query.helpers';
import { CatalogFilter, CatalogProductSort } from '../../models/product.models';

export class ListCatalogProductsQueryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  readonly shopId: string;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Attribute filters in `name:value1,value2` format. Repeat the parameter or separate groups with `;`. Values of the same attribute are combined with OR, different attributes with AND.',
    example: ['color:Red,Blue', 'screen:6'],
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseAttributeFilters(value))
  @IsArray()
  readonly attributes?: CatalogFilter[];

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly priceFrom?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly priceTo?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseBoolean(value))
  @IsBoolean()
  readonly available?: boolean;

  @ApiPropertyOptional({ enum: CatalogProductSort })
  @IsOptional()
  @IsEnum(CatalogProductSort)
  readonly sort?: CatalogProductSort;
}
