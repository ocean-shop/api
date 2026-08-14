import { Type } from 'class-transformer';
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

export class ProductImageItemDto {
  private static readonly BASE64_IMAGE_DATA_URI_REGEX =
    /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000_000)
  @ValidateIf(
    (_, value) => typeof value === 'string' && value.startsWith('data:image/'),
  )
  @Matches(ProductImageItemDto.BASE64_IMAGE_DATA_URI_REGEX, {
    message: 'image must be a valid base64 data URI',
  })
  @ValidateIf(
    (_, value) => typeof value === 'string' && !value.startsWith('data:image/'),
  )
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'image must be a valid URL',
    },
  )
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
