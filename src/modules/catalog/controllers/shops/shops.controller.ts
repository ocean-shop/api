import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { ADMIN_ROLES } from '../../../user/constants/role.constants';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import { CreateShopDto } from '../../dto/shops/create-shop.dto';
import { ListShopsQueryDto } from '../../dto/shops/list-shops-query.dto';
import { UpdateShopDto } from '../../dto/shops/update-shop.dto';
import { ShopsService } from '../../services/shops/shops.service';

@Controller('catalog/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Shops')
@ApiBearerAuth('access-token')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List shops with filters and pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listShops(@Query() query: ListShopsQueryDto) {
    return this.shopsService.listShops(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get shop by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getShopById(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.getShopById(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create shop' })
  @ApiBody({ type: CreateShopDto })
  async createShop(@Body() dto: CreateShopDto) {
    return this.shopsService.createShop(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update shop' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateShopDto })
  async updateShop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.updateShop(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Delete shop by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeShop(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.removeShop(id);
  }
}
