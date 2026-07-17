import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ProductStatus } from '../entities/enums/product.enum';

export class ListProductsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsUUID()
  readonly shopId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  readonly status?: ProductStatus;
}
