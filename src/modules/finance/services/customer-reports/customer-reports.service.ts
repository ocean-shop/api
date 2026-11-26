import { Injectable } from '@nestjs/common';
import { FINANCE_REPORT_TIME_ZONE } from '../../constants/finance-report.constants';
import { FinanceReportQueryDto } from '../../dto/finance-reports/finance-report-query.dto';
import { summarizeCustomerSegments } from '../../helpers/customer-segments/customer-segments.helpers';
import { buildCustomerInsights } from '../../helpers/finance-insights/finance-insights.helpers';
import {
  roundMoney,
  toMoney,
  toNumber,
  toRatio,
} from '../../helpers/finance-math/finance-math.helpers';
import {
  formatDateInTimeZone,
  resolveReportPeriods,
} from '../../helpers/report-period/report-period.helpers';
import {
  CustomerReport,
  CustomerSummary,
  CustomerSummaryRow,
} from '../../models/finance-report.models';
import { CustomerReportRepository } from '../../repositories/customer-report/customer-report.repository';

/** Avoids dividing by zero for shops without customers (averages become 0). */
const AVERAGE_ORDERS_DIVISOR_MIN = 1;

@Injectable()
export class CustomerReportsService {
  constructor(
    private readonly customerReportRepository: CustomerReportRepository,
  ) {}

  async getCustomerReport(
    query: FinanceReportQueryDto,
  ): Promise<CustomerReport> {
    const today = formatDateInTimeZone(new Date(), FINANCE_REPORT_TIME_ZONE);
    const { current } = resolveReportPeriods(query, today);

    const [summaryRow, segmentRows] = await Promise.all([
      this.customerReportRepository.findSummary(query.shopId, current),
      this.customerReportRepository.findSegments(query.shopId, current),
    ]);

    const summary = this.toSummary(summaryRow);
    const segments = summarizeCustomerSegments(segmentRows);

    return {
      period: current,
      summary,
      segments,
      insights: buildCustomerInsights(summary, segments),
    };
  }

  private toSummary(row: CustomerSummaryRow | undefined): CustomerSummary {
    const totalCustomers = toNumber(row?.totalCustomers);
    const repeatCustomers = toNumber(row?.repeatCustomers);
    const lifetimeRevenue = toNumber(row?.lifetimeRevenue);
    const periodRevenue = toMoney(row?.periodRevenue);
    const returningRevenue = toMoney(row?.returningRevenue);
    const customersDivisor = Math.max(
      totalCustomers,
      AVERAGE_ORDERS_DIVISOR_MIN,
    );

    return {
      totalCustomers,
      repeatCustomers,
      repeatRate: toRatio(repeatCustomers, totalCustomers),
      guestCustomers: toNumber(row?.guestCustomers),
      averageLtv: roundMoney(lifetimeRevenue / customersDivisor),
      averageOrdersPerCustomer: roundMoney(
        toNumber(row?.lifetimeOrders) / customersDivisor,
      ),
      activeCustomers: toNumber(row?.activeCustomers),
      newCustomers: toNumber(row?.newCustomers),
      returningCustomers: toNumber(row?.returningCustomers),
      periodRevenue,
      returningRevenue,
      returningRevenueShare: toRatio(returningRevenue, periodRevenue),
    };
  }
}
