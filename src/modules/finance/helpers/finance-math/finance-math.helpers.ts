import {
  MONEY_PRECISION,
  PERCENT,
  RATIO_PRECISION,
} from '../../constants/finance-report.constants';
import { RawAmount } from '../../models/finance-report.models';

const BASE = 10;

const roundTo = (value: number, digits: number): number => {
  const factor = BASE ** digits;

  return Math.round(value * factor) / factor;
};

/** Postgres `numeric`/`bigint` arrive as strings (or null for empty aggregates). */
export const toNumber = (value: RawAmount | undefined): number => {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundMoney = (value: number): number =>
  roundTo(value, MONEY_PRECISION);

export const toMoney = (value: RawAmount | undefined): number =>
  roundMoney(toNumber(value));

/** Safe `part / total` as a 0..1 ratio; 0 when the total is 0. */
export const toRatio = (part: number, total: number): number =>
  total === 0 ? 0 : roundTo(part / total, RATIO_PRECISION);

/** Percent change; `null` when there is no base to compare with. */
export const percentChange = (
  current: number,
  previous: number,
): number | null =>
  previous === 0
    ? null
    : roundTo(
        ((current - previous) / Math.abs(previous)) * PERCENT,
        MONEY_PRECISION,
      );
