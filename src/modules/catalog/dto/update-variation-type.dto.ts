import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VariationTypeName } from '../entities/enums/variation-type.enum';

export class UpdateVariationTypeDto {
  @IsOptional()
  @IsEnum(VariationTypeName)
  @IsNotEmpty()
  readonly name?: VariationTypeName;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly value?: string;
}
