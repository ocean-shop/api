import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductStatus, ProductType } from '../entities/enums/product.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsEnum(ProductType)
  readonly type?: ProductType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly description?: string | null;

  @IsOptional()
  @IsString()
  readonly landing?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus)
  readonly status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  readonly available?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly sku?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly oldPrice?: number | null;
}
