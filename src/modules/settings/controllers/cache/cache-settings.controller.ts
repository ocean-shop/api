import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CacheSettingsService } from '../../services/cache/cache-settings.service';

@Controller('settings/cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Settings')
@ApiBearerAuth('access-token')
export class CacheSettingsController {
  constructor(private readonly cacheSettingsService: CacheSettingsService) {}

  @Post('invalidate')
  @Roles('admin', 'super')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear every cached response across all shops',
  })
  async invalidateAll() {
    return this.cacheSettingsService.invalidateAll();
  }
}
