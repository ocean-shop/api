import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { CacheSettingsController } from './controllers/cache/cache-settings.controller';
import { ShopSettingsController } from './controllers/shop-settings/admin/shop-settings.controller';
import { ShopSettingsClientController } from './controllers/shop-settings/client/shop-settings-client.controller';
import { ShopSettings } from './entities/shop-settings.entity';
import { ShopSettingsRepository } from './repositories/shop-settings/shop-settings.repository';
import { CacheSettingsService } from './services/cache/cache-settings.service';
import { ShopSettingsService } from './services/shop-settings/admin/shop-settings.service';
import { ShopSettingsClientService } from './services/shop-settings/client/shop-settings-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShopSettings])],
  controllers: [
    CacheSettingsController,
    ShopSettingsController,
    ShopSettingsClientController,
  ],
  providers: [
    CacheSettingsService,
    ShopSettingsService,
    ShopSettingsClientService,
    ShopSettingsRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class SettingsModule {}
