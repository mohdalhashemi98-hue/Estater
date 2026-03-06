import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency, categoryLabel } from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function ExpenseBreakdownChart() {
  const { data = [] } = useQuery<{ category: string; total: number }[]>({
    queryKey: ['dashboard-expense-breakdown'],
    queryFn: () => api.get('/dashboard/expense-breakdown?months=12'),
  });

  const pieData = data.map(d => ({ name: categoryLabel(d.category), value: d.total }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-fade-in animate-stagger-1">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Expense Breakdown</h3>
      {pieData.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} strokeWidth={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 flex-1">
            {pieData.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-600 flex-1 truncate">{d.name}</span>
                <span className="text-gray-900 font-medium tabular-nums">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-6 text-center">No expenses recorded</p>
      )}
    </div>
  );
}
