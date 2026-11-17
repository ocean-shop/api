import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  UKRAINIAN_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from '../../../user/constants/phone.constants';
import { QUICK_ORDER_NAME_MAX_LENGTH } from '../../constants/quick-order.constants';
import { QuickOrderStatus } from '../../entities/enums/quick-order.enum';

export class UpdateQuickOrderDto {
  @ApiPropertyOptional({ maxLength: QUICK_ORDER_NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(QUICK_ORDER_NAME_MAX_LENGTH)
  readonly name?: string;

  @ApiPropertyOptional({ example: '+380991234567' })
  @IsOptional()
  @IsString()
  @Matches(UKRAINIAN_PHONE_REGEX, { message: VALIDATION_MESSAGES.PHONE })
  readonly phone?: string;

  @ApiPropertyOptional({ enum: QuickOrderStatus })
  @IsOptional()
  @IsEnum(QuickOrderStatus)
  readonly status?: QuickOrderStatus;
}
