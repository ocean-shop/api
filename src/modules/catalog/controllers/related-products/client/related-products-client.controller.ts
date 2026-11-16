import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RelatedProductsClientService } from '../../../services/related-products/client/related-products-client.service';

@Controller('catalog/products-client')
@ApiTags('Catalog Products')
export class RelatedProductsClientController {
  constructor(
    private readonly relatedProductsClientService: RelatedProductsClientService,
  ) {}

  @Get(':productId/related')
  @ApiOperation({
    summary:
      'List active related products of an active product of a shop in display order',
  })
  @ApiParam({ name: 'productId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async listRelatedProducts(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('shopId', ParseUUIDPipe) shopId: string,
  ) {
    return this.relatedProductsClientService.listRelatedProducts(
      productId,
      shopId,
    );
  }
}
