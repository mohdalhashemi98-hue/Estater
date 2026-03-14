import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency, formatCurrencyAxis } from '../../utils/formatters';
import { TrendingUp, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line,
  ReferenceDot,
} from 'recharts';

interface ProjectionMonth {
  month: string;
  expected_income: number;
  expected_expenses: number;
  mortgage_payments: number;
  net: number;
  contracts_expiring: number;
  revenue_at_risk: number;
}

interface ProjectionsResponse {
  months: ProjectionMonth[];
}

function monthLabel(iso: string) {
  const d = new Date(iso + '-01');
  return d.toLocaleString('en-US', { month: 'short' });
}

export default function FinancialProjections() {
  const { data, isLoading } = useQuery<ProjectionsResponse>({
    queryKey: ['analytics-projections'],
    queryFn: () => api.get('/analytics/projections'),
  });

  const months = data?.months ?? [];

  const chartData = months.map((m) => ({
    label: monthLabel(m.month),
    expected_income: m.expected_income,
    total_expenses: m.expected_expenses + m.mortgage_payments,
    net: m.net,
    contracts_expiring: m.contracts_expiring,
  }));

  const totalIncome = months.reduce((s, m) => s + m.expected_income, 0);
  const totalAtRisk = months.reduce((s, m) => s + m.revenue_at_risk, 0);

  const expiringDots = chartData
    .map((d, i) => (d.contracts_expiring > 0 ? i : null))
    .filter((i): i is number => i !== null);

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-medium text-text-primary">12-Month Forecast</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-[220px] bg-surface rounded-lg" />
          <div className="flex gap-6">
            <div className="h-4 w-40 bg-surface rounded" />
            <div className="h-4 w-36 bg-surface rounded" />
          </div>
        </div>
      ) : months.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">
          Create contracts to see projections
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#83827d' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyAxis}
                tick={{ fontSize: 10, fill: '#83827d' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    expected_income: 'Income',
                    total_expenses: 'Expenses',
                    net: 'Net',
                  };
                  return [formatCurrency(value), labels[name] ?? name];
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #dad9d4',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="expected_income"
                stroke="#10B981"
                fill="url(#incomeGrad)"
                strokeWidth={2}
                name="expected_income"
              />
              <Area
                type="monotone"
                dataKey="total_expenses"
                stroke="#EF4444"
                fill="url(#expenseGrad)"
                strokeWidth={2}
                name="total_expenses"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#6366F1"
                strokeWidth={2}
                dot={false}
                name="net"
              />
              {expiringDots.map((idx) => (
                <ReferenceDot
                  key={idx}
                  x={chartData[idx].label}
                  y={chartData[idx].expected_income}
                  r={4}
                  fill="#F59E0B"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs">
            <span className="text-text-secondary">
              Total projected income:{' '}
              <span className="font-medium text-text-primary">{formatCurrency(totalIncome)}</span>
            </span>
            {totalAtRisk > 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Revenue at risk: {formatCurrency(totalAtRisk)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
