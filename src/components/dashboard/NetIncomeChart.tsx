import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function NetIncomeChart() {
  const { data = [] } = useQuery<{ month: string; rent_income: number; expenses: number; mortgage_payments: number; net_income: number }[]>({
    queryKey: ['dashboard-net-income'],
    queryFn: () => api.get('/dashboard/net-income?months=12'),
  });

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-1">
      <h3 className="text-sm font-medium text-text-primary mb-4">Net Income (12 Months)</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#83827d' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#83827d' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name.replace(/_/g, ' ')]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #dad9d4', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="rent_income" name="Rent" fill="#10B981" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[0, 0, 0, 0]} stackId="b" />
            <Bar dataKey="mortgage_payments" name="Mortgage" fill="#F59E0B" radius={[2, 2, 0, 0]} stackId="b" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-text-muted py-6 text-center">No data yet</p>
      )}
    </div>
  );
}
