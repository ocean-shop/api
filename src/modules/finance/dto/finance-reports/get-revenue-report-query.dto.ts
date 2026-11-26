import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  REPORT_GRANULARITIES,
  type ReportGranularity,
} from '../../constants/finance-report.constants';
import { FinanceReportQueryDto } from './finance-report-query.dto';

export class GetRevenueReportQueryDto extends FinanceReportQueryDto {
  @ApiPropertyOptional({
    enum: REPORT_GRANULARITIES,
    description:
      'Timeline step. Default: day for ≤ 31 days, week for ≤ 120 days, month otherwise.',
  })
  @IsOptional()
  @IsIn(REPORT_GRANULARITIES)
  readonly groupBy?: ReportGranularity;
}
