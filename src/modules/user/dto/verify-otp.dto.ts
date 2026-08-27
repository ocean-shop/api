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
  @Matches(/^(\+380|380|0)\d{9}$/, {
    message:
      'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  readonly phone?: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 4 })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  readonly code: string;
}
