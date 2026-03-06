import { addMonths, format } from 'date-fns';

export interface AmortizationRow {
  payment_number: number;
  due_date: string;
  principal: number;
  interest: number;
  total_amount: number;
  remaining_balance: number;
}

export function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  startDate: string,
  monthlyPayment: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  let balance = loanAmount;
  const schedule: AmortizationRow[] = [];
  const start = new Date(startDate + 'T00:00:00');

  for (let i = 1; i <= termMonths && balance > 0; i++) {
    const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
    let principalPayment = Math.round((monthlyPayment - interestPayment) * 100) / 100;

    // Last payment adjustment
    if (principalPayment > balance) {
      principalPayment = balance;
    }

    balance = Math.round((balance - principalPayment) * 100) / 100;
    if (balance < 0) balance = 0;

    const dueDate = addMonths(start, i);

    schedule.push({
      payment_number: i,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      principal: principalPayment,
      interest: interestPayment,
      total_amount: Math.round((principalPayment + interestPayment) * 100) / 100,
      remaining_balance: balance,
    });
  }

  return schedule;
}

export function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.round(loanAmount / termMonths * 100) / 100;
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment * 100) / 100;
}
