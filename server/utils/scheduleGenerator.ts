import { addMonths as dfnsAddMonths, format } from 'date-fns';

export interface ScheduleInput {
  contractId: number;
  startDate: string;
  rentAmount: number;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  totalPayments: number;
}

export interface PaymentRow {
  contract_id: number;
  payment_number: number;
  due_date: string;
  amount: number;
  status: string;
}

const frequencyMonths: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

function addMonthsSafe(dateStr: string, months: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  const result = dfnsAddMonths(date, months);
  return format(result, 'yyyy-MM-dd');
}

export function generatePaymentSchedule(input: ScheduleInput): PaymentRow[] {
  const payments: PaymentRow[] = [];
  const monthsToAdd = frequencyMonths[input.frequency] || 1;
  let currentDate = input.startDate;

  for (let i = 1; i <= input.totalPayments; i++) {
    payments.push({
      contract_id: input.contractId,
      payment_number: i,
      due_date: currentDate,
      amount: input.rentAmount,
      status: 'pending',
    });
    currentDate = addMonthsSafe(currentDate, monthsToAdd);
  }

  return payments;
}
