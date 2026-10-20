import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IMAGE_MESSAGES } from '../../constants/image-messages.constants';
import {
  BASE64_IMAGE_DATA_URI_REGEX,
  IMAGE_ALT_MAX_LENGTH,
  IMAGE_DATA_URI_PREFIX,
  IMAGE_MAX_LENGTH,
  IMAGE_URL_PROTOCOLS,
} from '../../constants/product-image.constants';

export class ProductImageItemDto {
  @ApiProperty({
    description: 'Image URL or base64 data URI',
    example: 'https://cdn.example.com/products/image-1.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(IMAGE_MAX_LENGTH)
  @ValidateIf(
    (_, value) =>
      typeof value === 'string' && value.startsWith(IMAGE_DATA_URI_PREFIX),
  )
  @Matches(BASE64_IMAGE_DATA_URI_REGEX, {
    message: IMAGE_MESSAGES.INVALID_DATA_URI,
  })
  @ValidateIf(
    (_, value) =>
      typeof value === 'string' && !value.startsWith(IMAGE_DATA_URI_PREFIX),
  )
  @IsUrl(
    {
      protocols: IMAGE_URL_PROTOCOLS,
      require_protocol: true,
    },
    {
      message: IMAGE_MESSAGES.INVALID_URL,
    },
  )
  readonly image: string;

  @ApiPropertyOptional({
    maxLength: IMAGE_ALT_MAX_LENGTH,
    description: 'Alternative text for search engines and screen readers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(IMAGE_ALT_MAX_LENGTH)
  readonly alt?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly sort?: number;
}

export class AssignProductImagesDto {
  @ApiProperty({ type: () => [ProductImageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageItemDto)
  readonly images: ProductImageItemDto[];
}
