import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderPaymentStatus } from '../entities/enums/order.enum';

export class UpdateOrderPaymentStatusDto {
  @ApiProperty({ enum: OrderPaymentStatus })
  @IsEnum(OrderPaymentStatus)
  readonly paymentStatus: OrderPaymentStatus;
}
