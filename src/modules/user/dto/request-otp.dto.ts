import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @Matches(/^(\+380|380|0)\d{9}$/, {
    message:
      'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  readonly phone?: string;
}
