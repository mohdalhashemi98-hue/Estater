import { ExpenseSummary } from '../../types';
import { formatCurrency, categoryLabel } from '../../utils/formatters';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'];

export default function ExpenseSummaryCharts({ summary }: { summary: ExpenseSummary }) {
  const pieData = summary.by_category.map(c => ({
    name: categoryLabel(c.category),
    value: c.total,
  }));

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Category pie chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 chart-reveal">
        <h3 className="text-sm font-medium text-gray-900 mb-4">By Category</h3>
        {pieData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600 flex-1">{d.name}</span>
                  <span className="text-gray-900 font-medium tabular-nums">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">No data</p>
        )}
      </div>

      {/* Monthly trend bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 chart-reveal" style={{ animationDelay: '0.15s' }}>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Monthly Trend</h3>
        {summary.monthly_trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.monthly_trend}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Expenses']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
              <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">No data</p>
        )}
      </div>
    </div>
  );
}
