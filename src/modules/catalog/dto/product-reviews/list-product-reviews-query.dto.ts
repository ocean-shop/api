import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  DEFAULT_SORT_ORDER,
  SORT_ORDERS,
} from '../../../../core/response/constants/sort.constants';
import type { SortOrder } from '../../../../core/response/models/response.models';
import {
  PRODUCT_REVIEW_RATING_MAX,
  PRODUCT_REVIEW_RATING_MIN,
} from '../../constants/product-review.constants';
import { ProductReviewStatus } from '../../entities/enums/product-review.enum';

export class ListProductReviewsQueryDto {
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly productId?: string;

  @ApiPropertyOptional({ enum: ProductReviewStatus })
  @IsOptional()
  @IsEnum(ProductReviewStatus)
  readonly status?: ProductReviewStatus;

  @ApiPropertyOptional({
    minimum: PRODUCT_REVIEW_RATING_MIN,
    maximum: PRODUCT_REVIEW_RATING_MAX,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PRODUCT_REVIEW_RATING_MIN)
  @Max(PRODUCT_REVIEW_RATING_MAX)
  readonly rating?: number;

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
