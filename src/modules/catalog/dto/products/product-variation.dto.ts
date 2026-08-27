import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly attributeTypeId: string;
}

export class ProductVariationDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly sku: string;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly price: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly oldPrice?: number | null;

  @ApiProperty()
  @IsBoolean()
  readonly available: boolean;

  @ApiProperty()
  @IsBoolean()
  readonly isDefault: boolean;

  @ApiProperty({ type: () => [ProductVariationAttributeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationAttributeItemDto)
  readonly attributes: ProductVariationAttributeItemDto[];

  @ApiProperty({ type: () => [ProductImageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
