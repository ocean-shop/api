import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
