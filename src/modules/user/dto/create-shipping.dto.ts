import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
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
}
