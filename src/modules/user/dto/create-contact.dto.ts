import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import {
  CONTACT_REGEX,
  VALIDATION_MESSAGES,
} from '../constants/phone.constants';

export class CreateContactDto {
  @ApiProperty({ example: 'Іван', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly username: string;

  @ApiProperty({
    example: '+380991234567',
    description:
      'Email or Ukrainian phone number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  @IsString()
  @Matches(CONTACT_REGEX, {
    message: VALIDATION_MESSAGES.CONTACT,
  })
  @MaxLength(255)
  readonly contact: string;

  @ApiProperty({ example: 'Хочу дізнатися про доставку', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  readonly message: string;
}
