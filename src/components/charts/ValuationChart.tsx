import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency, formatCurrencyAxis } from '../../utils/formatters';

interface ValuationDataPoint {
  date: string;
  value: number;
}

interface ValuationChartProps {
  data: ValuationDataPoint[];
  purchasePrice?: number;
  onHover?: (value: number | null, date: string | null) => void;
  height?: number;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export default function ValuationChart({ data, purchasePrice, onHover, height = 300 }: ValuationChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('ALL');

  const filterByPeriod = (points: ValuationDataPoint[]): ValuationDataPoint[] => {
    if (period === 'ALL' || points.length === 0) return points;

    const now = new Date();
    const cutoff = new Date();
    switch (period) {
      case '1M': cutoff.setMonth(now.getMonth() - 1); break;
      case '3M': cutoff.setMonth(now.getMonth() - 3); break;
      case '6M': cutoff.setMonth(now.getMonth() - 6); break;
      case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
    }

    const filtered = points.filter(p => new Date(p.date) >= cutoff);
    return filtered.length > 0 ? filtered : points;
  };

  const filtered = filterByPeriod(data);
  const isPositive = filtered.length >= 2
    ? filtered[filtered.length - 1].value >= filtered[0].value
    : true;

  const gradientColor = isPositive ? '#10B981' : '#EF4444';
  const periods: TimePeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              period === p
                ? 'bg-text-primary text-white'
                : 'bg-surface-overlay text-text-muted hover:bg-surface-border'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={filtered}
          onMouseMove={(e: any) => {
            if (e?.activePayload?.[0]) {
              onHover?.(e.activePayload[0].value, e.activePayload[0].payload.date);
            }
          }}
          onMouseLeave={() => onHover?.(null, null)}
        >
          <defs>
            <linearGradient id="valuationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={gradientColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#83827d' }}
            tickFormatter={d => {
              const date = new Date(d);
              return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(2)}`;
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#83827d' }}
            tickFormatter={formatCurrencyAxis}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Value']}
            labelFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #dad9d4',
              backgroundColor: '#fff',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          {purchasePrice && (
            <ReferenceLine
              y={purchasePrice}
              stroke="#94A3B8"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{ value: 'Purchase', position: 'right', fontSize: 10, fill: '#94A3B8' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={gradientColor}
            strokeWidth={2}
            fill="url(#valuationGradient)"
            dot={false}
            activeDot={{ r: 4, stroke: gradientColor, strokeWidth: 2, fill: '#FFFFFF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
