import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
