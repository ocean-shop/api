import { IsNotEmpty, IsUUID } from 'class-validator';
import { ListOrdersQueryDto } from './list-orders-query.dto';

export class ListOrdersByUserQueryDto extends ListOrdersQueryDto {
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;
}
