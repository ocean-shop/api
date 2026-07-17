import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProductCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  readonly categoryId: string;
}
