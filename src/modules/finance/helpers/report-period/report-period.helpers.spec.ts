import { BadRequestException } from '@nestjs/common';
import {
  addDays,
  countDays,
  formatDateInTimeZone,
  resolveGranularity,
  resolveReportPeriods,
} from './report-period.helpers';

describe('report-period helpers', () => {
  describe('formatDateInTimeZone', () => {
    it('should format the date in the given time zone', () => {
      const lateUtcEvening = new Date('2026-11-25T23:30:00Z');

      expect(formatDateInTimeZone(lateUtcEvening, 'Europe/Kyiv')).toBe(
        '2026-11-26',
      );
      expect(formatDateInTimeZone(lateUtcEvening, 'UTC')).toBe('2026-11-25');
    });
  });

  describe('addDays / countDays', () => {
    it('should shift dates across month and year bounds', () => {
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('should count days inclusively', () => {
      expect(countDays('2026-11-01', '2026-11-30')).toBe(30);
      expect(countDays('2026-11-01', '2026-11-01')).toBe(1);
    });
  });

  describe('resolveReportPeriods', () => {
    it('should default to the last 30 days and build the previous period', () => {
      const result = resolveReportPeriods({}, '2026-11-30');

      expect(result).toEqual({
        current: {
          from: '2026-11-01',
          to: '2026-11-30',
          toExclusive: '2026-12-01',
          days: 30,
        },
        previous: {
          from: '2026-10-02',
          to: '2026-10-31',
          toExclusive: '2026-11-01',
          days: 30,
        },
      });
    });

    it('should use explicit bounds', () => {
      const result = resolveReportPeriods(
        { from: '2026-10-01', to: '2026-10-10' },
        '2026-11-30',
      );

      expect(result.current.days).toBe(10);
      expect(result.previous).toEqual({
        from: '2026-09-21',
        to: '2026-09-30',
        toExclusive: '2026-10-01',
        days: 10,
      });
    });

    it('should throw when from is after to', () => {
      expect(() =>
        resolveReportPeriods({ from: '2026-11-10', to: '2026-11-01' }, 'x'),
      ).toThrow(BadRequestException);
    });

    it('should throw when the period is too long', () => {
      expect(() =>
        resolveReportPeriods({ from: '2025-01-01', to: '2026-11-01' }, 'x'),
      ).toThrow(BadRequestException);
    });
  });

  describe('resolveGranularity', () => {
    it('should keep an explicit granularity', () => {
      expect(resolveGranularity(300, 'day')).toBe('day');
    });

    it('should pick day, week or month by period length', () => {
      expect(resolveGranularity(31)).toBe('day');
      expect(resolveGranularity(90)).toBe('week');
      expect(resolveGranularity(200)).toBe('month');
    });
  });
});
