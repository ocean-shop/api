import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetShopStatisticQueryDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;
}
