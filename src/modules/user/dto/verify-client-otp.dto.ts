import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyClientOtpDto {
  @ApiProperty({
    example: '+380991234567',
    description:
      'Email or Ukrainian phone number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  @IsString()
  @IsNotEmpty()
  readonly login: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 4 })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  readonly code: string;
}
