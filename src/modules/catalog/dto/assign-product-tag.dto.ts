import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProductTagDto {
  @IsUUID()
  @IsNotEmpty()
  readonly tagId: string;
}
