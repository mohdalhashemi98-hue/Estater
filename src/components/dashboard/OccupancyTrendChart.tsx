import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OccupancyTrendChart() {
  const { data = [] } = useQuery<{ month: string; occupancy_pct: number }[]>({
    queryKey: ['dashboard-occupancy-trend'],
    queryFn: () => api.get('/dashboard/occupancy-trend'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-fade-in">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Occupancy Trend</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Occupancy']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
            <Line type="monotone" dataKey="occupancy_pct" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
      )}
    </div>
  );
}
