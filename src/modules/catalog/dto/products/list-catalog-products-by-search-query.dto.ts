import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  PRODUCT_SEARCH_TERM_MAX_LENGTH,
  PRODUCT_SEARCH_TERM_MIN_LENGTH,
} from '../../constants/pagination.constants';
import { normalizeSearchTerm } from '../../helpers/catalog-query.helpers';
import { ListCatalogProductsQueryDto } from './list-catalog-products-query.dto';

/**
 * The catalog page selected by a search string: everything the category page
 * accepts, plus the term, so the storefront reuses one set of controls.
 */
export class ListCatalogProductsBySearchQueryDto extends ListCatalogProductsQueryDto {
  @ApiProperty({
    type: String,
    minLength: PRODUCT_SEARCH_TERM_MIN_LENGTH,
    maxLength: PRODUCT_SEARCH_TERM_MAX_LENGTH,
    description: 'Search string typed by the user, matched against the name.',
    example: 'футболка',
  })
  @Transform(({ value }: { value: unknown }) => normalizeSearchTerm(value))
  @IsString()
  @MinLength(PRODUCT_SEARCH_TERM_MIN_LENGTH)
  @MaxLength(PRODUCT_SEARCH_TERM_MAX_LENGTH)
  readonly query: string;
}
