import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsClientService } from '../../../services/products/client/products-client.service';
import { ListCatalogProductsQueryDto } from '../../../dto/products/list-catalog-products-query.dto';

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

  @Get('by-category/:categoryId')
  @ApiOperation({
    summary:
      'List active catalog products of a category with filters, sorting and pagination',
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
    summary: 'List catalog filters available for products of a category',
  })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  async getFiltersByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.productsClientService.getFiltersByCategoryId(categoryId);
  }
}
