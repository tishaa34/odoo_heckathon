import { describe, expect, it } from 'vitest';
import { currency, isLicenseExpired, initials, number, percent, toNumber } from './format';

describe('format utils', () => {
  it('coerces Prisma decimal strings to numbers', () => {
    expect(toNumber('1234.50')).toBe(1234.5);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(42)).toBe(42);
  });

  it('formats currency in INR grouping', () => {
    expect(currency(2450000)).toBe('₹24,50,000');
    expect(currency('3150')).toBe('₹3,150');
  });

  it('formats plain numbers', () => {
    expect(number(182000)).toBe('1,82,000');
  });

  it('formats percentages and handles null', () => {
    expect(percent(81)).toBe('81.0%');
    expect(percent(null)).toBe('—');
  });

  it('detects expired licenses', () => {
    expect(isLicenseExpired('2000-01-01')).toBe(true);
    expect(isLicenseExpired('2999-01-01')).toBe(false);
  });

  it('derives initials from a name', () => {
    expect(initials('Raven Kapoor')).toBe('RK');
    expect(initials('Priya')).toBe('P');
  });
});
