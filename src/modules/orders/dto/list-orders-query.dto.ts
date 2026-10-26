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
import {
  DEFAULT_SORT_ORDER,
  SORT_ORDERS,
} from '../../../core/response/constants/sort.constants';
import type { SortOrder } from '../../../core/response/models/response.models';

export class ListOrdersQueryDto {
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
  readonly orderNumber?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.toLowerCase();
  })
  @IsIn(SORT_ORDERS)
  readonly sortOrder?: SortOrder = DEFAULT_SORT_ORDER;
}
