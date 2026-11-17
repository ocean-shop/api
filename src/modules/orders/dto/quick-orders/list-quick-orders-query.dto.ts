import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_SORT_ORDER,
  SORT_ORDERS,
} from '../../../../core/response/constants/sort.constants';
import type { SortOrder } from '../../../../core/response/models/response.models';
import { QUICK_ORDER_SEARCH_MAX_LENGTH } from '../../constants/quick-order.constants';
import { QuickOrderStatus } from '../../entities/enums/quick-order.enum';

export class ListQuickOrdersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @ApiPropertyOptional({ enum: QuickOrderStatus })
  @IsOptional()
  @IsEnum(QuickOrderStatus)
  readonly status?: QuickOrderStatus;

  @ApiPropertyOptional({
    description: 'Search by customer name or phone',
    maxLength: QUICK_ORDER_SEARCH_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(QUICK_ORDER_SEARCH_MAX_LENGTH)
  readonly search?: string;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: DEFAULT_SORT_ORDER })
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
