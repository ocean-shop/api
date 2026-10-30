import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
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

  @ApiProperty({
    example: '3f1c2b9e-8a4d-4e2f-9b1a-2c3d4e5f6a7b',
    format: 'uuid',
    description: 'Shop the client signs in to; the client is bound to it',
  })
  @IsUUID()
  readonly shopId: string;
}
