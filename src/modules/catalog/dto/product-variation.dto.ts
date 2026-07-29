import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductImageItemDto } from './assign-product-images.dto';

export class ProductVariationAttributeItemDto {
  @IsUUID()
  readonly attributeTypeId: string;
}

export class ProductVariationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly sku: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly oldPrice?: number | null;

  @IsBoolean()
  readonly available: boolean;

  @IsBoolean()
  readonly isDefault: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationAttributeItemDto)
  readonly attributes: ProductVariationAttributeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
