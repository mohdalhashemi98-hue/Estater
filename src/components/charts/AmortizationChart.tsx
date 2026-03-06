import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatCurrencyAxis } from '../../utils/formatters';
import { MortgagePayment } from '../../types';

interface AmortizationChartProps {
  payments: MortgagePayment[];
  height?: number;
}

export default function AmortizationChart({ payments, height = 300 }: AmortizationChartProps) {
  const data = payments.map(p => ({
    payment: p.payment_number,
    date: p.due_date,
    principal: Math.round(p.principal * 100) / 100,
    interest: Math.round(p.interest * 100) / 100,
    balance: Math.round(p.remaining_balance * 100) / 100,
  }));

  const interval = Math.max(1, Math.floor(data.length / 12)) - 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="payment"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          interval={interval}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Payment #', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#9CA3AF' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={formatCurrencyAxis}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name === 'principal' ? 'Principal' : name === 'interest' ? 'Interest' : 'Balance']}
          labelFormatter={l => `Payment #${l}`}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#fff',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Area
          type="monotone"
          dataKey="principal"
          stackId="1"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="interest"
          stackId="1"
          stroke="#EF4444"
          fill="#EF4444"
          fillOpacity={0.15}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
