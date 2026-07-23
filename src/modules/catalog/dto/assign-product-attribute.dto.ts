import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProductAttributeDto {
  @IsUUID()
  @IsNotEmpty()
  readonly attributeTypeId: string;

  @IsBoolean()
  readonly assign: boolean;
}
