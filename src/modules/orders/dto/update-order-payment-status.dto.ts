import { IsEnum } from 'class-validator';
import { OrderPaymentStatus } from '../entities/enums/order.enum';

export class UpdateOrderPaymentStatusDto {
  @IsEnum(OrderPaymentStatus)
  readonly paymentStatus: OrderPaymentStatus;
}
