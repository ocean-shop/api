import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  UKRAINIAN_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from '../../../user/constants/phone.constants';
import { QUICK_ORDER_NAME_MAX_LENGTH } from '../../constants/quick-order.constants';

export class CreateQuickOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @ApiProperty({ maxLength: QUICK_ORDER_NAME_MAX_LENGTH, example: 'Олена' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(QUICK_ORDER_NAME_MAX_LENGTH)
  readonly name: string;

  @ApiProperty({ example: '+380991234567' })
  @IsString()
  @Matches(UKRAINIAN_PHONE_REGEX, { message: VALIDATION_MESSAGES.PHONE })
  readonly phone: string;
}
