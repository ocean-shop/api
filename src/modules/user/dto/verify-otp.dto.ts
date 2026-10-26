import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UKRAINIAN_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from '../constants/phone.constants';

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: 'admin@shop.com' })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    example: '+380991234567',
    description: 'Required when email is not provided',
  })
  @ValidateIf((o: VerifyOtpDto) => !o.email)
  @IsString()
  @Matches(UKRAINIAN_PHONE_REGEX, {
    message: VALIDATION_MESSAGES.PHONE,
  })
  readonly phone?: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 4 })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  readonly code: string;
}
