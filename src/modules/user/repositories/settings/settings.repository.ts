import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from '../../entities/user-settings.entity';

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectRepository(UserSettings)
    private readonly repository: Repository<UserSettings>,
  ) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async save(settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.repository.save(settings);
  }
}
