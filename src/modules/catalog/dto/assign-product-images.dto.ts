import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductImageItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  readonly url: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly sort?: number;
}

export class AssignProductImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
