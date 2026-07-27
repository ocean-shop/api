import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { VariationTypeName } from '../entities/enums/variation-type.enum';

export class ListVariationTypesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsEnum(VariationTypeName)
  readonly name?: VariationTypeName;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly value?: string;
}
