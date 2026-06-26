import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from '../../services/settings/settings.service';
import { UpdateSettingsDto } from '../../dto/update-settings.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('user/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  @Roles('admin')
  async getSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Post()
  @Roles('admin')
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
