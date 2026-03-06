import { describe, it, expect } from 'vitest';
import { generatePaymentSchedule } from './scheduleGenerator';

describe('generatePaymentSchedule', () => {
  it('generates correct number of payments', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-01-01',
      rentAmount: 5000,
      frequency: 'monthly',
      totalPayments: 12,
    });
    expect(result).toHaveLength(12);
  });

  it('sets correct amount for each payment', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-01-01',
      rentAmount: 8000,
      frequency: 'monthly',
      totalPayments: 3,
    });
    expect(result.every(p => p.amount === 8000)).toBe(true);
  });

  it('generates monthly intervals from 1st of month', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-01-01',
      rentAmount: 5000,
      frequency: 'monthly',
      totalPayments: 3,
    });
    expect(result[0].due_date).toBe('2025-01-01');
    expect(result[1].due_date).toBe('2025-02-01');
    expect(result[2].due_date).toBe('2025-03-01');
  });

  it('generates quarterly intervals', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-03-01',
      rentAmount: 15000,
      frequency: 'quarterly',
      totalPayments: 4,
    });
    expect(result[0].due_date).toBe('2025-03-01');
    // Each subsequent payment is 3 months after the previous
    expect(result).toHaveLength(4);
    // Verify intervals are roughly 3 months apart
    const month0 = new Date(result[0].due_date).getMonth();
    const month1 = new Date(result[1].due_date).getMonth();
    expect((month1 - month0 + 12) % 12).toBe(3);
  });

  it('generates semi-annual intervals', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-03-01',
      rentAmount: 30000,
      frequency: 'semi_annual',
      totalPayments: 2,
    });
    expect(result[0].due_date).toBe('2025-03-01');
    // Second payment is 6 months later
    const month0 = new Date(result[0].due_date).getMonth();
    const month1 = new Date(result[1].due_date).getMonth();
    expect((month1 - month0 + 12) % 12).toBe(6);
  });

  it('generates annual intervals', () => {
    const result = generatePaymentSchedule({
      contractId: 1,
      startDate: '2025-01-01',
      rentAmount: 60000,
      frequency: 'annual',
      totalPayments: 2,
    });
    expect(result[0].due_date).toBe('2025-01-01');
    expect(result[1].due_date).toBe('2026-01-01');
  });

  it('sets all payments to pending status', () => {
    const result = generatePaymentSchedule({
      contractId: 5,
      startDate: '2025-01-01',
      rentAmount: 1000,
      frequency: 'monthly',
      totalPayments: 6,
    });
    expect(result.every(p => p.status === 'pending')).toBe(true);
  });

  it('assigns correct contract_id and payment_number', () => {
    const result = generatePaymentSchedule({
      contractId: 42,
      startDate: '2025-01-01',
      rentAmount: 1000,
      frequency: 'monthly',
      totalPayments: 3,
    });
    expect(result[0].contract_id).toBe(42);
    expect(result[0].payment_number).toBe(1);
    expect(result[1].payment_number).toBe(2);
    expect(result[2].payment_number).toBe(3);
  });
});
