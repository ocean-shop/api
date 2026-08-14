import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
  OrderStatus,
} from '../entities/enums/order.enum';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly shippingNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orderNumber: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly subtotalAmount: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly discountAmount: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly totalAmount: number;

  @IsEnum(OrderPaymentMethod)
  readonly paymentMethod: OrderPaymentMethod;

  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  readonly paymentStatus?: OrderPaymentStatus;

  @IsEnum(OrderShippingMethod)
  readonly shippingMethod: OrderShippingMethod;

  @IsOptional()
  @IsEnum(OrderStatus)
  readonly status?: OrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  readonly items: CreateOrderItemDto[];
}
