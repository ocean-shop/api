import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsClientService } from '../../../services/products/client/products-client.service';
import { ListCatalogProductsBySearchQueryDto } from '../../../dto/products/list-catalog-products-by-search-query.dto';
import { ListCatalogProductsQueryDto } from '../../../dto/products/list-catalog-products-query.dto';
import { SearchCatalogProductsQueryDto } from '../../../dto/products/search-catalog-products-query.dto';
import { PRODUCT_SEARCH_LIMIT } from '../../../constants/pagination.constants';

@Controller('catalog/products-client')
@ApiTags('Catalog Products')
export class ProductsClientController {
  constructor(private readonly productsClientService: ProductsClientService) {}

  @Get('popular')
  @ApiOperation({ summary: 'List first 6 popular products' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  async listPopularProducts(
    @Query('shopId', new ParseUUIDPipe({ optional: true })) shopId?: string,
  ) {
    return this.productsClientService.listPopularProducts(shopId);
  }

  // Declared before `:productId` so the literal path wins the route match.
  @Get('search')
  @ApiOperation({
    summary: `Count the active products of a shop matching a search string and return the ${PRODUCT_SEARCH_LIMIT} most relevant ones`,
  })
  async searchProducts(@Query() query: SearchCatalogProductsQueryDto) {
    return this.productsClientService.searchProducts(query.shopId, query.query);
  }

  // Declared before `:productId` so the literal path wins the route match.
  @Get('by-search')
  @ApiOperation({
    summary:
      'List active catalog products matching a search string with filters, sorting and pagination',
    description:
      'Accepts the same filters, sorting and pagination as the category listing. Without `sort` the page is ordered by relevance. ' +
      'The response carries a `filters` array of the same shape as `filters/by-category/{categoryId}`, built from every attribute of the products the search string matches and independent of the filters applied to the page.',
  })
  async listCatalogProductsBySearch(
    @Query() query: ListCatalogProductsBySearchQueryDto,
  ) {
    return this.productsClientService.listCatalogProductsBySearch(query);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({
    summary:
      'List active catalog products of a category and its subcategories with filters, sorting and pagination',
  })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  async listCatalogProducts(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: ListCatalogProductsQueryDto,
  ) {
    return this.productsClientService.listCatalogProducts(categoryId, query);
  }

  @Get('filters/by-category/:categoryId')
  @ApiOperation({
    summary:
      'List catalog filters available for products of a category and its subcategories',
  })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async getFiltersByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('shopId', ParseUUIDPipe) shopId: string,
  ) {
    return this.productsClientService.getFiltersByCategoryId(
      categoryId,
      shopId,
    );
  }

  @Get(':productId')
  @ApiOperation({
    summary:
      'Get an active product of a shop with its images, tags and variations with their images',
  })
  @ApiParam({ name: 'productId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async getProductById(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('shopId', ParseUUIDPipe) shopId: string,
  ) {
    return this.productsClientService.getProductById(productId, shopId);
  }
}
