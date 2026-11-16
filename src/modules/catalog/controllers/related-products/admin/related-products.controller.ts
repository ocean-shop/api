import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { ADMIN_ROLES } from '../../../../user/constants/role.constants';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { AssignRelatedProductsDto } from '../../../dto/products/assign-related-products.dto';
import { RelatedProductsService } from '../../../services/related-products/admin/related-products.service';

@Controller('catalog/products')
@ApiTags('Catalog Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class RelatedProductsController {
  constructor(
    private readonly relatedProductsService: RelatedProductsService,
  ) {}

  @Get(':id/related')
  @ApiOperation({
    summary: 'List related products of a product in display order',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async listRelatedProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.relatedProductsService.listRelatedProducts(id);
  }

  @Put(':id/related')
  @ApiOperation({
    summary:
      'Replace the related products of a product; array order is the display order',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignRelatedProductsDto })
  async assignRelatedProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRelatedProductsDto,
  ) {
    return this.relatedProductsService.assignRelatedProducts(id, dto);
  }
}
