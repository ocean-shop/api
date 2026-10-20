import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  UKRAINIAN_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from '../constants/phone.constants';

export class RequestOtpDto {
  @ApiPropertyOptional({ example: 'admin@shop.com' })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    example: '+380991234567',
    description: 'Required when email is not provided',
  })
  @ValidateIf((o: RequestOtpDto) => !o.email)
  @IsString()
  @Matches(UKRAINIAN_PHONE_REGEX, {
    message: VALIDATION_MESSAGES.PHONE,
  })
  readonly phone?: string;
}
