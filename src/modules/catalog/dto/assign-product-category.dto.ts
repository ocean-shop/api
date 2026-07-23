import { IsBoolean, IsUUID } from 'class-validator';

export class AssignProductCategoryDto {
  @IsUUID()
  readonly categoryId: string;

  @IsBoolean()
  readonly assign: boolean;
}
