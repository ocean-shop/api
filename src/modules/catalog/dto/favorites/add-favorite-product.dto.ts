import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddFavoriteProductDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  readonly shopId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  readonly productId: string;
}
