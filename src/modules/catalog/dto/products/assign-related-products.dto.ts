import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { RELATED_PRODUCTS_MAX } from '../../constants/related-product.constants';

export class AssignRelatedProductsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    maxItems: RELATED_PRODUCTS_MAX,
    description:
      'Full list of related product ids in display order. Replaces the current list; an empty array clears it.',
  })
  @IsArray()
  @ArrayMaxSize(RELATED_PRODUCTS_MAX)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  readonly productIds: string[];
}
