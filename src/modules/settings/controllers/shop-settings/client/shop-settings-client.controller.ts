import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ShopSettingsClientService } from '../../../services/shop-settings/client/shop-settings-client.service';

@Controller('settings/shops-client')
@ApiTags('Shop Settings')
export class ShopSettingsClientController {
  constructor(
    private readonly shopSettingsClientService: ShopSettingsClientService,
  ) {}

  @Get(':shopId')
  @ApiOperation({
    summary: 'Get storefront settings: feature flags and full color scheme',
  })
  @ApiParam({ name: 'shopId', type: String, format: 'uuid' })
  async getShopSettings(@Param('shopId', ParseUUIDPipe) shopId: string) {
    return this.shopSettingsClientService.getShopSettings(shopId);
  }
}
