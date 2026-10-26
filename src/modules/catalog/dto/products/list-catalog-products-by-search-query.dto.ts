import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PRODUCT_SEARCH_TERM_MAX_LENGTH,
  PRODUCT_SEARCH_TERM_MIN_LENGTH,
} from '../../constants/pagination.constants';
import {
  normalizeSearchTerm,
  parseCategoryIds,
} from '../../helpers/catalog-query.helpers';
import { ListCatalogProductsQueryDto } from './list-catalog-products-query.dto';

/**
 * The catalog page selected by a search string: everything the category page
 * accepts, plus the term and the categories the results are narrowed to, so
 * the storefront reuses one set of controls.
 */
export class ListCatalogProductsBySearchQueryDto extends ListCatalogProductsQueryDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Categories the results are narrowed to, taken from the `categories` of a previous response. Repeat the parameter or separate the ids with `,`. ' +
      'A category matches the products of its whole subtree, the same way `by-category/{categoryId}` does, and several categories are combined with OR. ' +
      'The `filters` and `categories` of the response stay independent of it.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseCategoryIds(value))
  @IsArray()
  @IsUUID('4', { each: true })
  readonly categoryIds?: string[];

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
