import { Injectable } from '@nestjs/common';
import { UserLanguage } from '../../entities/enums/user-settings.enum';
import { UserSettings } from '../../entities/user-settings.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { SettingsRepository } from '../../repositories/settings/settings.repository';
import { UpdateSettingsDto } from '../../dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getSettings(userId: string): Promise<UserSettings> {
    await this.userRepository.findById(userId);

    const settings = await this.settingsRepository.findByUserId(userId);
    if (settings) {
      return settings;
    }

    return this.settingsRepository.save({
      userId,
      language: UserLanguage.EN,
    });
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<UserSettings> {
    await this.userRepository.findById(dto.userId);

    return this.settingsRepository.save({
      userId: dto.userId,
      language: dto.language,
    });
  }
}
