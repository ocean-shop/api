import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SettingsService } from '../../services/settings/settings.service';
import { UpdateSettingsDto } from '../../dto/update-settings.dto';

@Controller('user/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  async getSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Post()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
