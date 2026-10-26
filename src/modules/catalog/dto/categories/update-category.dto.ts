import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsUUID()
  readonly parentId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly metaTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly metaDescription?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  readonly canonicalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly noIndex?: boolean;
}
