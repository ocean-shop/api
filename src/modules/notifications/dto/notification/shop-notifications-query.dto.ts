import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/** Selects the shop whose notifications are counted, streamed or marked read. */
export class ShopNotificationsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;
}
