import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { PRODUCT_REPORT_LIMITS } from '../../constants/finance-report.constants';
import { FinanceReportQueryDto } from './finance-report-query.dto';

export class GetProductReportQueryDto extends FinanceReportQueryDto {
  @ApiPropertyOptional({
    default: PRODUCT_REPORT_LIMITS.DEFAULT_LIMIT,
    description: 'How many products to return in each list.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PRODUCT_REPORT_LIMITS.MAX_LIMIT)
  readonly limit: number = PRODUCT_REPORT_LIMITS.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    default: PRODUCT_REPORT_LIMITS.DEFAULT_DEAD_STOCK_DAYS,
    description:
      'An active product with no sales for this many days is dead stock.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(PRODUCT_REPORT_LIMITS.MIN_DEAD_STOCK_DAYS)
  @Max(PRODUCT_REPORT_LIMITS.MAX_DEAD_STOCK_DAYS)
  readonly deadStockDays: number =
    PRODUCT_REPORT_LIMITS.DEFAULT_DEAD_STOCK_DAYS;
}
