import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SORT_ORDERS } from '../../../../../core/response/constants/sort.constants';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { ADMIN_ROLES } from '../../../../user/constants/role.constants';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { ListProductReviewsQueryDto } from '../../../dto/product-reviews/list-product-reviews-query.dto';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReviewsService } from '../../../services/product-reviews/admin/product-reviews.service';

@Controller('catalog/product-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Product Reviews')
@ApiBearerAuth('access-token')
export class ProductReviewsController {
  constructor(private readonly productReviewsService: ProductReviewsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List product reviews of a shop' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiQuery({ name: 'status', required: false, enum: ProductReviewStatus })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SORT_ORDERS })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listProductReviews(@Query() query: ListProductReviewsQueryDto) {
    return this.productReviewsService.listProductReviews(query);
  }
}
