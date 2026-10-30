import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { CacheSettingsController } from './controllers/cache/cache-settings.controller';
import { CacheSettingsService } from './services/cache/cache-settings.service';

@Module({
  imports: [],
  controllers: [CacheSettingsController],
  providers: [CacheSettingsService, JwtAuthGuard, RolesGuard],
})
export class SettingsModule {}
