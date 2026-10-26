import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsOptional()
  @IsUUID()
  readonly parentId?: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly metaDescription?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  readonly canonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  readonly noIndex?: boolean;
}
