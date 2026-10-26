import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderShippingMethod } from '../../orders/entities/enums/order.enum';

export class CreateShippingDto {
  @ApiProperty({ enum: OrderShippingMethod })
  @IsEnum(OrderShippingMethod)
  method: OrderShippingMethod;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
