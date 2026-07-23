import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductStatus, ProductType } from '../entities/enums/product.enum';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsOptional()
  @IsEnum(ProductType)
  readonly type?: ProductType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly landing?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  readonly status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  readonly available?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly oldPrice?: number;
}
