import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly unitPrice: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly quantity: number;
}
