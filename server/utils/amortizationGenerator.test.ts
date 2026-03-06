import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './amortizationGenerator';

describe('calculateMonthlyPayment', () => {
  it('calculates standard mortgage payment', () => {
    // AED 1,000,000 loan at 4% for 25 years (300 months)
    const payment = calculateMonthlyPayment(1000000, 4, 300);
    // Expected ~5278.36 AED/month
    expect(payment).toBeGreaterThan(5200);
    expect(payment).toBeLessThan(5400);
  });

  it('handles zero interest rate', () => {
    const payment = calculateMonthlyPayment(120000, 0, 12);
    expect(payment).toBe(10000);
  });

  it('handles short term loan', () => {
    const payment = calculateMonthlyPayment(50000, 5, 12);
    expect(payment).toBeGreaterThan(4000);
    expect(payment).toBeLessThan(5000);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of rows', () => {
    const monthlyPayment = calculateMonthlyPayment(100000, 5, 60);
    const schedule = generateAmortizationSchedule(100000, 5, 60, '2025-01-01', monthlyPayment);
    expect(schedule.length).toBe(60);
  });

  it('has decreasing balance', () => {
    const monthlyPayment = calculateMonthlyPayment(100000, 5, 24);
    const schedule = generateAmortizationSchedule(100000, 5, 24, '2025-01-01', monthlyPayment);

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].remaining_balance).toBeLessThanOrEqual(schedule[i - 1].remaining_balance);
    }
  });

  it('ends with near-zero balance', () => {
    const monthlyPayment = calculateMonthlyPayment(100000, 5, 60);
    const schedule = generateAmortizationSchedule(100000, 5, 60, '2025-01-01', monthlyPayment);
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.remaining_balance).toBeLessThanOrEqual(1);
  });

  it('has increasing principal and decreasing interest over time', () => {
    // Use 8% rate so interest dominates early payments
    const monthlyPayment = calculateMonthlyPayment(200000, 8, 120);
    const schedule = generateAmortizationSchedule(200000, 8, 120, '2025-01-01', monthlyPayment);

    // At 8%, first payment interest (~$1333) > principal (~$1093)
    expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);
    // Last payment should have more principal than interest
    expect(schedule[schedule.length - 1].principal).toBeGreaterThan(schedule[schedule.length - 1].interest);
  });

  it('sequential payment numbers', () => {
    const monthlyPayment = calculateMonthlyPayment(50000, 3, 12);
    const schedule = generateAmortizationSchedule(50000, 3, 12, '2025-01-01', monthlyPayment);

    schedule.forEach((row, i) => {
      expect(row.payment_number).toBe(i + 1);
    });
  });

  it('generates correct date format', () => {
    const monthlyPayment = calculateMonthlyPayment(50000, 3, 3);
    const schedule = generateAmortizationSchedule(50000, 3, 3, '2025-01-01', monthlyPayment);

    expect(schedule[0].due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schedule[0].due_date).toBe('2025-02-01');
    expect(schedule[1].due_date).toBe('2025-03-01');
    expect(schedule[2].due_date).toBe('2025-04-01');
  });
});
