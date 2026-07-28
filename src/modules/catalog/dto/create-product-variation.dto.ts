import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProductImageItemDto } from './assign-product-images.dto';

export class ProductVariationAttributeItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly value: string;
}

export class CreateProductVariationDto {
  @IsString()
  @IsIn(['product_variations'])
  readonly variation: 'product_variations';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationAttributeItemDto)
  readonly attributes: ProductVariationAttributeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
