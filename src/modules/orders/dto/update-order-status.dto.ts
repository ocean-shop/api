import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/enums/order.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  readonly status: OrderStatus;
}
