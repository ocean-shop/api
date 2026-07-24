import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductImageItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000_000)
  @Matches(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/, {
    message: 'image must be a valid base64 data URI',
  })
  readonly image: string;

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
