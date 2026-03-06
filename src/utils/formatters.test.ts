import { describe, it, expect } from 'vitest';
import {
  formatCurrency, formatCurrencyCompact, formatCurrencyAxis,
  formatDate, daysUntil, frequencyLabel, formatFileSize,
  formatAddress, fileIcon, statusColor,
} from './formatters';

describe('formatCurrency', () => {
  it('formats with AED prefix and whole numbers', () => {
    expect(formatCurrency(5000)).toBe('AED 5,000');
    expect(formatCurrency(1234567.89)).toBe('AED 1,234,568');
    expect(formatCurrency(0)).toBe('AED 0');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats millions', () => {
    expect(formatCurrencyCompact(1500000)).toBe('AED 1.5M');
    expect(formatCurrencyCompact(2000000)).toBe('AED 2.0M');
  });
  it('formats thousands', () => {
    expect(formatCurrencyCompact(50000)).toBe('AED 50.0K');
    expect(formatCurrencyCompact(1200)).toBe('AED 1.2K');
  });
  it('formats small amounts', () => {
    expect(formatCurrencyCompact(500)).toBe('AED 500');
  });
});

describe('formatCurrencyAxis', () => {
  it('formats for chart axes', () => {
    expect(formatCurrencyAxis(2000000)).toBe('AED 2M');
    expect(formatCurrencyAxis(50000)).toBe('AED 50k');
    expect(formatCurrencyAxis(500)).toBe('AED 500');
  });
});

describe('formatDate', () => {
  it('formats date strings', () => {
    const result = formatDate('2025-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
  it('handles empty input', () => {
    expect(formatDate('')).toBe('-');
  });
});

describe('daysUntil', () => {
  it('calculates days until future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split('T')[0];
    expect(daysUntil(dateStr)).toBe(10);
  });
  it('returns negative for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dateStr = pastDate.toISOString().split('T')[0];
    expect(daysUntil(dateStr)).toBe(-5);
  });
});

describe('frequencyLabel', () => {
  it('returns human-readable labels', () => {
    expect(frequencyLabel('monthly')).toBe('Monthly');
    expect(frequencyLabel('quarterly')).toBe('Quarterly');
    expect(frequencyLabel('semi_annual')).toBe('Semi-Annual');
    expect(frequencyLabel('annual')).toBe('Annual');
  });
  it('returns raw value for unknown frequencies', () => {
    expect(frequencyLabel('weekly')).toBe('weekly');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });
  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });
  it('formats megabytes', () => {
    expect(formatFileSize(5242880)).toBe('5.0 MB');
  });
});

describe('formatAddress', () => {
  it('builds full address', () => {
    expect(formatAddress({
      villa_number: 'Villa 5',
      street: 'Al Wasl Road',
      neighborhood: 'Jumeirah',
      city: 'Dubai Marina',
      emirate: 'Dubai',
    })).toBe('Villa 5, Al Wasl Road, Jumeirah, Dubai Marina, Dubai');
  });
  it('handles minimal address', () => {
    expect(formatAddress({ emirate: 'Dubai' })).toBe('Dubai');
  });
  it('handles partial address', () => {
    expect(formatAddress({ city: 'JBR', emirate: 'Dubai' })).toBe('JBR, Dubai');
  });
});

describe('fileIcon', () => {
  it('identifies file types', () => {
    expect(fileIcon('application/pdf')).toBe('pdf');
    expect(fileIcon('image/jpeg')).toBe('image');
    expect(fileIcon('image/png')).toBe('image');
    expect(fileIcon('application/msword')).toBe('word');
    expect(fileIcon('application/vnd.ms-excel')).toBe('excel');
    expect(fileIcon('text/plain')).toBe('file');
  });
});

describe('statusColor', () => {
  it('returns correct CSS classes for known statuses', () => {
    expect(statusColor('active')).toContain('emerald');
    expect(statusColor('expired')).toContain('gray');
    expect(statusColor('overdue')).toContain('red');
    expect(statusColor('pending')).toContain('amber');
    expect(statusColor('paid')).toContain('emerald');
  });
  it('returns gray for unknown statuses', () => {
    expect(statusColor('unknown')).toContain('gray');
  });
});
