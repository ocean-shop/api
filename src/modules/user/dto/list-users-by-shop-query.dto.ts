import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListUsersByShopQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly email?: string;

  @IsOptional()
  @Transform(
    ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
      if (typeof value === 'string') {
        return value;
      }
      if (typeof obj?.phone_number === 'string') {
        return obj.phone_number;
      }
      return value;
    },
  )
  @IsString()
  @IsNotEmpty()
  readonly phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.toLowerCase();
  })
  @IsIn(['asc', 'desc'])
  readonly sortOrder?: 'asc' | 'desc' = 'desc';
}
