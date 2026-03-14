import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CashFlowData } from '../types';
import { formatCurrency } from '../utils/formatters';
import CashFlowChart from '../components/charts/CashFlowChart';
import { Wallet, TrendingUp, TrendingDown, Landmark } from 'lucide-react';

export default function CashFlow() {
  const { data: cashflow = [], isLoading } = useQuery<CashFlowData[]>({
    queryKey: ['cashflow'],
    queryFn: () => api.get('/mortgages/cashflow'),
  });

  const { data: summary } = useQuery<{
    total_mortgages: number;
    total_loan_amount: number;
    total_remaining: number;
    total_monthly_payment: number;
  }>({
    queryKey: ['mortgage-summary'],
    queryFn: () => api.get('/mortgages/summary'),
  });

  const totalIncome = cashflow.reduce((s, d) => s + d.rent_income, 0);
  const totalMortgage = cashflow.reduce((s, d) => s + d.mortgage_payment, 0);
  const totalNet = totalIncome - totalMortgage;

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-surface-border border-t-accent-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-[-0.02em]">Cash Flow Analysis</h2>
        <p className="text-sm text-text-muted mt-0.5">Rent income vs. mortgage payments across your portfolio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-sm text-text-muted">Total Rent Income</p>
          </div>
          <p className="text-xl font-semibold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <p className="text-sm text-text-muted">Total Mortgage</p>
          </div>
          <p className="text-xl font-semibold text-red-600">{formatCurrency(totalMortgage)}</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-accent-500" />
            <p className="text-sm text-text-muted">Net Cash Flow</p>
          </div>
          <p className={`text-xl font-semibold ${totalNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalNet)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-4 h-4 text-text-muted" />
            <p className="text-sm text-text-muted">Active Mortgages</p>
          </div>
          <p className="text-xl font-semibold text-text-primary">{summary?.total_mortgages ?? 0}</p>
          {summary && summary.total_monthly_payment > 0 && (
            <p className="text-xs text-text-muted mt-1">{formatCurrency(summary.total_monthly_payment)}/mo</p>
          )}
        </div>
      </div>

      {/* Chart */}
      {cashflow.length > 0 ? (
        <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
          <h3 className="font-semibold text-sm text-text-primary mb-4">Monthly Cash Flow</h3>
          <CashFlowChart data={cashflow} />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <Wallet className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No cash flow data yet.</p>
          <p className="text-sm text-text-muted mt-1">Add mortgages to your properties to see rent vs. mortgage analysis.</p>
        </div>
      )}

      {/* Per-Property Breakdown */}
      {cashflow.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h3 className="font-semibold text-sm text-text-primary">Monthly Breakdown by Property</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Property</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Month</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Rent Income</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Mortgage</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {cashflow.slice(0, 30).map((d, i) => (
                <tr key={i} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-2.5 text-text-primary font-medium">{d.property_name}</td>
                  <td className="px-4 py-2.5 text-text-muted">{d.month}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">{formatCurrency(d.rent_income)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">{formatCurrency(d.mortgage_payment)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${d.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(d.net_cash_flow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Mortgage Summary */}
      {summary && summary.total_mortgages > 0 && (
        <div className="bg-white rounded-xl border border-surface-border p-5">
          <h3 className="font-semibold text-sm text-text-primary mb-4">Mortgage Portfolio Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-muted">Total Borrowed</p>
              <p className="font-semibold text-text-primary text-lg mt-0.5">{formatCurrency(summary.total_loan_amount)}</p>
            </div>
            <div>
              <p className="text-text-muted">Total Remaining</p>
              <p className="font-semibold text-text-primary text-lg mt-0.5">{formatCurrency(summary.total_remaining)}</p>
            </div>
            <div>
              <p className="text-text-muted">Paid Off</p>
              <p className="font-semibold text-emerald-600 text-lg mt-0.5">
                {formatCurrency(summary.total_loan_amount - summary.total_remaining)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Monthly Obligation</p>
              <p className="font-semibold text-text-primary text-lg mt-0.5">{formatCurrency(summary.total_monthly_payment)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
