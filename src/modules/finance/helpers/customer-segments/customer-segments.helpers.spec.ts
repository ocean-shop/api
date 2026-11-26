import {
  CustomerSegment,
  RECENCY_BUCKET,
} from '../../constants/finance-report.constants';
import {
  pickCustomerSegment,
  summarizeCustomerSegments,
} from './customer-segments.helpers';

describe('customer-segments helpers', () => {
  describe('pickCustomerSegment', () => {
    const cases: [number, number, CustomerSegment][] = [
      [3, RECENCY_BUCKET.UNDER_1_MONTH, 'champions'],
      [3, RECENCY_BUCKET.UNDER_2_MONTHS, 'champions'],
      [3, RECENCY_BUCKET.UNDER_4_MONTHS, 'loyal'],
      [2, RECENCY_BUCKET.UNDER_1_MONTH, 'loyal'],
      [1, RECENCY_BUCKET.UNDER_1_MONTH, 'new'],
      [1, RECENCY_BUCKET.UNDER_4_MONTHS, 'promising'],
      [2, RECENCY_BUCKET.UNDER_1_YEAR, 'atRisk'],
      [1, RECENCY_BUCKET.UNDER_1_YEAR, 'hibernating'],
      [3, RECENCY_BUCKET.OVER_1_YEAR, 'lost'],
    ];

    it.each(cases)(
      'should map frequency %i and recency bucket %i to %s',
      (frequency, bucket, segment) => {
        expect(pickCustomerSegment(frequency, bucket)).toBe(segment);
      },
    );
  });

  describe('summarizeCustomerSegments', () => {
    it('should aggregate rows into all segments with shares', () => {
      const result = summarizeCustomerSegments([
        {
          frequency: '3',
          recencyBucket: '0',
          customersCount: '2',
          revenue: '300',
        },
        {
          frequency: '3',
          recencyBucket: '1',
          customersCount: '1',
          revenue: '100.5',
        },
        {
          frequency: '1',
          recencyBucket: '4',
          customersCount: '1',
          revenue: '10',
        },
      ]);

      expect(result).toHaveLength(7);
      expect(result.find((item) => item.segment === 'champions')).toEqual({
        segment: 'champions',
        customersCount: 3,
        revenue: 400.5,
        customersShare: 0.75,
      });
      expect(
        result.find((item) => item.segment === 'lost')?.customersCount,
      ).toBe(1);
      expect(result.find((item) => item.segment === 'new')).toEqual({
        segment: 'new',
        customersCount: 0,
        revenue: 0,
        customersShare: 0,
      });
    });
  });
});
