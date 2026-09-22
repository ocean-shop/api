import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../../services/products/products.service';
import { ListProductsQueryDto } from '../../dto/products/list-products-query.dto';

@Controller('catalog/products-client')
@ApiTags('Catalog Products')
export class ProductsClientController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('popular')
  @ApiOperation({ summary: 'List first 6 popular products' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  async listPopularProducts(
    @Query('shopId', new ParseUUIDPipe({ optional: true })) shopId?: string,
  ) {
    return this.productsService.listPopularProducts(shopId);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'List products by category id' })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  async listProductsByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByCategoryId(categoryId, query);
  }

  @Get('filters/by-category/:categoryId')
  @ApiOperation({
    summary: 'List catalog filters available for products of a category',
  })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  async getFiltersByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.productsService.getFiltersByCategoryId(categoryId);
  }
}
