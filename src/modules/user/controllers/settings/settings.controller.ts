import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from '../../services/settings/settings.service';
import { UpdateSettingsDto } from '../../dto/update-settings.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('user/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User Settings')
@ApiBearerAuth('access-token')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get user settings by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  async getSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create or update user settings' })
  @ApiBody({ type: UpdateSettingsDto })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
