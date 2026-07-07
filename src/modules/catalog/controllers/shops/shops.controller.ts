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
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateShopDto } from '../../dto/create-shop.dto';
import { ListShopsQueryDto } from '../../dto/list-shops-query.dto';
import { UpdateShopDto } from '../../dto/update-shop.dto';
import { ShopsService } from '../../services/shops/shops.service';

@Controller('catalog/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @Roles('admin', 'super')
  async listShops(@Query() query: ListShopsQueryDto) {
    return this.shopsService.listShops(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  async getShopById(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.getShopById(id);
  }

  @Post()
  @Roles('admin', 'super')
  async createShop(@Body() dto: CreateShopDto) {
    return this.shopsService.createShop(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  async updateShop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.updateShop(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeShop(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.removeShop(id);
  }
}
