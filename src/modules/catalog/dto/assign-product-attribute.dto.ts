import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProductAttributeDto {
  @IsUUID()
  @IsNotEmpty()
  readonly attributeTypeId: string;
}
