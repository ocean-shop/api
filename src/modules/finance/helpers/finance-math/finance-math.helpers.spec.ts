import {
  percentChange,
  roundMoney,
  toMoney,
  toNumber,
  toRatio,
} from './finance-math.helpers';

describe('finance-math helpers', () => {
  it('should parse raw amounts and fall back to 0', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });

  it('should round money to 2 digits', () => {
    expect(roundMoney(10.006)).toBe(10.01);
    expect(toMoney('99.999')).toBe(100);
  });

  it('should build a safe ratio', () => {
    expect(toRatio(1, 3)).toBe(0.3333);
    expect(toRatio(5, 0)).toBe(0);
  });

  it('should compute percent change or null without a base', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(10, -20)).toBe(150);
    expect(percentChange(10, 0)).toBeNull();
  });
});
