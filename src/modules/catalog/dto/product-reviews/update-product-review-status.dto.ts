import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProductReviewStatus } from '../../entities/enums/product-review.enum';

export class UpdateProductReviewStatusDto {
  @ApiProperty({
    enum: ProductReviewStatus,
    example: ProductReviewStatus.APPROVED,
  })
  @IsEnum(ProductReviewStatus)
  readonly status: ProductReviewStatus;
}
