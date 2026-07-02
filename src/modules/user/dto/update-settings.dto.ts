import { IsEnum, IsUUID } from 'class-validator';
import { UserLanguage } from '../entities/enums/user-settings.enum';

export class UpdateSettingsDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserLanguage)
  language: UserLanguage;
}
