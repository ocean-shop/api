import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateShopSettingsDto } from '../../../dto/shop-settings/update-shop-settings.dto';
import { ShopSettingsService } from '../../../services/shop-settings/admin/shop-settings.service';

@Controller('settings/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Shop Settings')
@ApiBearerAuth('access-token')
export class ShopSettingsController {
  constructor(private readonly shopSettingsService: ShopSettingsService) {}

  @Get(':shopId')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get shop settings (feature flags and palette)' })
  @ApiParam({ name: 'shopId', type: String, format: 'uuid' })
  async getShopSettings(@Param('shopId', ParseUUIDPipe) shopId: string) {
    return this.shopSettingsService.getShopSettings(shopId);
  }

  @Patch(':shopId')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update shop settings (partial)' })
  @ApiParam({ name: 'shopId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateShopSettingsDto })
  async updateShopSettings(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Body() dto: UpdateShopSettingsDto,
  ) {
    return this.shopSettingsService.updateShopSettings(shopId, dto);
  }
}
