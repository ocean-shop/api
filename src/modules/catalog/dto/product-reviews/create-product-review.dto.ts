import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
  PRODUCT_REVIEW_COMMENT_MAX_LENGTH,
  PRODUCT_REVIEW_NAME_MAX_LENGTH,
  PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH,
  PRODUCT_REVIEW_RATING_MAX,
  PRODUCT_REVIEW_RATING_MIN,
} from '../../constants/product-review.constants';

export class CreateProductReviewDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @ApiProperty({ maxLength: PRODUCT_REVIEW_NAME_MAX_LENGTH, example: 'Олена' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_REVIEW_NAME_MAX_LENGTH)
  readonly name: string;

  @ApiPropertyOptional({ maxLength: PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH)
  readonly advantages?: string;

  @ApiPropertyOptional({ maxLength: PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_REVIEW_PROS_CONS_MAX_LENGTH)
  readonly drawbacks?: string;

  @ApiProperty({ maxLength: PRODUCT_REVIEW_COMMENT_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_REVIEW_COMMENT_MAX_LENGTH)
  readonly comment: string;

  @ApiProperty({
    minimum: PRODUCT_REVIEW_RATING_MIN,
    maximum: PRODUCT_REVIEW_RATING_MAX,
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(PRODUCT_REVIEW_RATING_MIN)
  @Max(PRODUCT_REVIEW_RATING_MAX)
  readonly rating: number;
}
