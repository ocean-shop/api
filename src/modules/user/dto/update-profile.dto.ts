import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  BIRTHDAY_REGEX,
  VALIDATION_MESSAGES,
} from '../constants/phone.constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 300, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  fullName?: string | null;

  @ApiPropertyOptional({ maxLength: 30, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '1990-05-21',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(BIRTHDAY_REGEX, {
    message: VALIDATION_MESSAGES.BIRTHDAY,
  })
  birthday?: string | null;
}
