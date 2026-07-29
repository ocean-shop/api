import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ProductImageItemDto } from './assign-product-images.dto';

export class ProductVariationAttributeItemDto {
  @IsUUID()
  readonly attributeTypeId: string;
}

export class ProductVariationDto {
  @IsString()
  @IsIn(['product_variations'])
  readonly variation: 'product_variations';

  @IsOptional()
  @IsUUID()
  readonly variationId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationAttributeItemDto)
  readonly attributes: ProductVariationAttributeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
