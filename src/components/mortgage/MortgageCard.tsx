import { Link } from 'react-router-dom';
import { Mortgage } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Landmark, ArrowRight } from 'lucide-react';

interface MortgageCardProps {
  mortgage: Mortgage;
}

export default function MortgageCard({ mortgage }: MortgageCardProps) {
  const paidPercent = mortgage.remaining_balance && mortgage.loan_amount
    ? ((mortgage.loan_amount - mortgage.remaining_balance) / mortgage.loan_amount) * 100
    : 0;

  return (
    <Link
      to={`/mortgages/${mortgage.id}`}
      className="bg-white rounded-xl border border-surface-border p-4 hover:shadow-md hover:border-surface-border transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <h4 className="font-medium text-text-primary text-sm">{mortgage.lender_name}</h4>
            <p className="text-xs text-text-muted capitalize">{mortgage.loan_type} rate &middot; {mortgage.interest_rate}%</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-600 transition-colors" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-text-muted text-xs">Loan Amount</p>
          <p className="font-medium text-text-primary">{formatCurrency(mortgage.loan_amount)}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Monthly Payment</p>
          <p className="font-medium text-text-primary">{formatCurrency(mortgage.monthly_payment)}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Remaining</p>
          <p className="font-medium text-text-primary">{formatCurrency(mortgage.remaining_balance ?? mortgage.loan_amount)}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Term</p>
          <p className="font-medium text-text-primary">{Math.round(mortgage.term_months / 12)} years</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Paid off</span>
          <span>{paidPercent.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-surface-overlay rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(paidPercent, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
