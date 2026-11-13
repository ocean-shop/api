import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : value,
  )
  @IsBoolean()
  readonly unreadOnly?: boolean;
}
