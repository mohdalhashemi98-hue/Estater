import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OccupancyTrendChart() {
  const { data = [] } = useQuery<{ month: string; occupancy_pct: number }[]>({
    queryKey: ['dashboard-occupancy-trend'],
    queryFn: () => api.get('/dashboard/occupancy-trend'),
  });

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
      <h3 className="text-sm font-medium text-text-primary mb-4">Occupancy Trend</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#83827d' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#83827d' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Occupancy']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #dad9d4', fontSize: '12px' }} />
            <Line type="monotone" dataKey="occupancy_pct" stroke="#c96442" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-text-muted py-6 text-center">No data yet</p>
      )}
    </div>
  );
}
