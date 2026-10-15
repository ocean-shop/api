import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles.guard';
import type { AuthenticatedRequest } from '../../../../user/models/auth-request.models';
import { AddFavoriteProductDto } from '../../../dto/favorites/add-favorite-product.dto';
import { ListFavoriteProductsQueryDto } from '../../../dto/favorites/list-favorite-products-query.dto';
import { FavoritesClientService } from '../../../services/favorites/client/favorites-client.service';

@Controller('catalog/favorites-client')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Favorites')
@ApiBearerAuth('access-token')
export class FavoritesClientController {
  constructor(
    private readonly favoritesClientService: FavoritesClientService,
  ) {}

  @Get(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({
    summary:
      'List active favorite products of a user in a shop, newest favorite first',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  async listFavoriteProducts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListFavoriteProductsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesClientService.listFavoriteProducts(
      userId,
      query,
      request.user,
    );
  }

  @Post(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({
    summary:
      'Add an active product of a shop to user favorites. Adding an already favorite product is a no-op.',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: AddFavoriteProductDto })
  async addFavoriteProduct(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AddFavoriteProductDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesClientService.addFavoriteProduct(
      userId,
      dto,
      request.user,
    );
  }

  @Delete(':userId/:productId')
  @Roles('user', 'admin', 'super')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from user favorites' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiParam({ name: 'productId', type: String, format: 'uuid' })
  async removeFavoriteProduct(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.favoritesClientService.removeFavoriteProduct(
      userId,
      productId,
      request.user,
    );
  }
}
