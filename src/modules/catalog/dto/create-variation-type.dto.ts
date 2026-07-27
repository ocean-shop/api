import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VariationTypeName } from '../entities/enums/variation-type.enum';

export class CreateVariationTypeDto {
  @IsEnum(VariationTypeName)
  @IsNotEmpty()
  readonly name: VariationTypeName;

  @IsString()
  @IsNotEmpty()
  readonly value: string;
}
