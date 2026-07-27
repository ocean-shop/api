import { IsEnum, IsNotEmpty } from 'class-validator';
import { VariationTypeName } from '../entities/enums/variation-type.enum';

export class CreateVariationTypeDto {
  @IsEnum(VariationTypeName)
  @IsNotEmpty()
  readonly name: VariationTypeName;
}
