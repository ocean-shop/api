import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DashboardQueryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  readonly shopId: string;
}
