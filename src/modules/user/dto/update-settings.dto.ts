import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { UserLanguage } from '../entities/enums/user-settings.enum';

export class UpdateSettingsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: UserLanguage })
  @IsEnum(UserLanguage)
  language: UserLanguage;
}
