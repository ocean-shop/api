import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestClientOtpDto {
  @ApiProperty({
    example: '+380991234567',
    description:
      'Email or Ukrainian phone number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  @IsString()
  @IsNotEmpty()
  readonly login: string;
}
