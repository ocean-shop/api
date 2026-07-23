import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProductTagDto {
  @IsUUID()
  @IsNotEmpty()
  readonly tagId: string;

  @IsBoolean()
  readonly assign: boolean;
}
