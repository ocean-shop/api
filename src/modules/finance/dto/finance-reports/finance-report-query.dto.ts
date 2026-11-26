import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID, Matches } from 'class-validator';
import { FINANCE_REPORT_MESSAGES } from '../../constants/finance-messages.constants';
import { REPORT_DATE_REGEX } from '../../constants/finance-report.constants';

export class FinanceReportQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly shopId: string;

  @ApiPropertyOptional({
    example: '2026-11-01',
    description:
      'Start date (inclusive, shop-local). Default: 30 days before `to`.',
  })
  @IsOptional()
  @Matches(REPORT_DATE_REGEX, { message: FINANCE_REPORT_MESSAGES.INVALID_DATE })
  @IsISO8601(
    { strict: true },
    { message: FINANCE_REPORT_MESSAGES.INVALID_DATE },
  )
  readonly from?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'End date (inclusive, shop-local). Default: today.',
  })
  @IsOptional()
  @Matches(REPORT_DATE_REGEX, { message: FINANCE_REPORT_MESSAGES.INVALID_DATE })
  @IsISO8601(
    { strict: true },
    { message: FINANCE_REPORT_MESSAGES.INVALID_DATE },
  )
  readonly to?: string;
}
