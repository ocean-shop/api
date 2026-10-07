import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly shippingNumber: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orderNumber: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly firstName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly lastName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly middleName?: string;

  @ApiPropertyOptional({ example: 'customer@example.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  readonly email?: string;

  @ApiPropertyOptional({ example: '+380991234567' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+380|380|0)\d{9}$/, {
    message:
      'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  readonly phoneNumber?: string;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly subtotalAmount: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly discountAmount: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly totalAmount: number;

  @ApiProperty({ enum: OrderPaymentMethod })
  @IsEnum(OrderPaymentMethod)
  readonly paymentMethod: OrderPaymentMethod;

  @ApiPropertyOptional({ enum: OrderPaymentStatus })
  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  readonly paymentStatus?: OrderPaymentStatus;

  @ApiProperty({ enum: OrderShippingMethod })
  @IsEnum(OrderShippingMethod)
  readonly shippingMethod: OrderShippingMethod;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  readonly status?: OrderStatus;

  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  readonly items: CreateOrderItemDto[];
}
