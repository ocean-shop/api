import { BadRequestException } from '@nestjs/common';
import { FINANCE_REPORT_MESSAGES } from '../../constants/finance-messages.constants';
import {
  AUTO_GRANULARITY_MAX_DAYS,
  MS_IN_DAY,
  REPORT_PERIOD_LIMITS,
  ReportGranularity,
} from '../../constants/finance-report.constants';
import {
  ReportPeriod,
  ReportPeriodInput,
  ReportPeriods,
} from '../../models/finance-report.models';

/** `en-CA` formats dates as `YYYY-MM-DD`, which is what the reports use. */
const ISO_DATE_LOCALE = 'en-CA';
const ISO_DATE_LENGTH = 10;

const toUtcMs = (date: string): number => Date.parse(`${date}T00:00:00Z`);

export const formatDateInTimeZone = (now: Date, timeZone: string): string =>
  new Intl.DateTimeFormat(ISO_DATE_LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

export const addDays = (date: string, days: number): string =>
  new Date(toUtcMs(date) + days * MS_IN_DAY)
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);

/** Number of calendar days in an inclusive range. */
export const countDays = (from: string, to: string): number =>
  Math.round((toUtcMs(to) - toUtcMs(from)) / MS_IN_DAY) + 1;

const buildPeriod = (from: string, to: string): ReportPeriod => ({
  from,
  to,
  toExclusive: addDays(to, 1),
  days: countDays(from, to),
});

/**
 * Fills missing bounds (default: last 30 days up to `today`), validates the range
 * and builds the previous period of the same length that ends right before `from`.
 */
export const resolveReportPeriods = (
  input: ReportPeriodInput,
  today: string,
): ReportPeriods => {
  const to = input.to ?? today;
  const from = input.from ?? addDays(to, 1 - REPORT_PERIOD_LIMITS.DEFAULT_DAYS);

  if (toUtcMs(from) > toUtcMs(to)) {
    throw new BadRequestException(FINANCE_REPORT_MESSAGES.FROM_AFTER_TO);
  }

  const current = buildPeriod(from, to);

  if (current.days > REPORT_PERIOD_LIMITS.MAX_DAYS) {
    throw new BadRequestException(FINANCE_REPORT_MESSAGES.PERIOD_TOO_LONG);
  }

  const previousTo = addDays(from, -1);
  const previous = buildPeriod(
    addDays(previousTo, 1 - current.days),
    previousTo,
  );

  return { current, previous };
};

/** Explicit choice wins; otherwise pick a step that gives a readable chart. */
export const resolveGranularity = (
  days: number,
  requested?: ReportGranularity,
): ReportGranularity => {
  if (requested) {
    return requested;
  }

  if (days <= AUTO_GRANULARITY_MAX_DAYS.DAY) {
    return 'day';
  }

  return days <= AUTO_GRANULARITY_MAX_DAYS.WEEK ? 'week' : 'month';
};
