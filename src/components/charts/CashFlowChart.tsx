import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { formatCurrency, formatCurrencyAxis } from '../../utils/formatters';
import { CashFlowData } from '../../types';

interface CashFlowChartProps {
  data: CashFlowData[];
  height?: number;
}

export default function CashFlowChart({ data, height = 350 }: CashFlowChartProps) {
  const byMonth = data.reduce<Record<string, { month: string; income: number; mortgage: number; net: number }>>((acc, d) => {
    if (!d.month) return acc;
    if (!acc[d.month]) {
      acc[d.month] = { month: d.month, income: 0, mortgage: 0, net: 0 };
    }
    acc[d.month].income += d.rent_income;
    acc[d.month].mortgage += d.mortgage_payment;
    acc[d.month].net += d.net_cash_flow;
    return acc;
  }, {});

  const chartData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ede9de" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#83827d' }}
          tickFormatter={m => {
            const [y, mo] = m.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#83827d' }}
          tickFormatter={formatCurrencyAxis}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'income' ? 'Rent Income' : name === 'mortgage' ? 'Mortgage' : 'Net Cash Flow',
          ]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #dad9d4',
            backgroundColor: '#fff',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Legend
          formatter={n => (n === 'income' ? 'Rent Income' : n === 'mortgage' ? 'Mortgage Payment' : 'Net')}
          wrapperStyle={{ fontSize: '0.75rem' }}
        />
        <ReferenceLine y={0} stroke="#D1D5DB" strokeOpacity={0.5} />
        <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="mortgage" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
