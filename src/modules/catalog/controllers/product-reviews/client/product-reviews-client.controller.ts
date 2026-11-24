import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { ALL_ROLES } from '../../../../user/constants/role.constants';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import type { AuthenticatedRequest } from '../../../../user/models/auth-request.models';
import { CreateProductReviewDto } from '../../../dto/product-reviews/create-product-review.dto';
import { ListProductReviewsClientQueryDto } from '../../../dto/product-reviews/list-product-reviews-client-query.dto';
import { ProductReviewsClientService } from '../../../services/product-reviews/client/product-reviews-client.service';

@Controller('catalog/product-reviews-client')
@ApiTags('Catalog Product Reviews')
export class ProductReviewsClientController {
  constructor(
    private readonly productReviewsClientService: ProductReviewsClientService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALL_ROLES)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Create a review of an active product of a shop. It waits for moderation.',
  })
  @ApiBody({ type: CreateProductReviewDto })
  async createProductReview(
    @Body() dto: CreateProductReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productReviewsClientService.createProductReview(
      dto,
      request.user,
    );
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'List approved reviews of a product of a shop, newest first',
  })
  @ApiParam({ name: 'productId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: ListProductReviewsClientQueryDto,
  ) {
    return this.productReviewsClientService.listProductReviews(
      productId,
      query,
    );
  }
}
