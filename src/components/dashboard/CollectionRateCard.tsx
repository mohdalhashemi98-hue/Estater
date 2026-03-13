import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

export default function CollectionRateCard() {
  const { data } = useQuery<{ collected: number; total_due: number; rate: number }>({
    queryKey: ['dashboard-collection-rate'],
    queryFn: () => api.get('/dashboard/collection-rate?months=6'),
  });

  const rate = data?.rate ?? 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
      <h3 className="text-sm font-medium text-text-primary mb-4">Collection Rate</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ede9de" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#c96442" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-1000 ease-out-expo" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-text-primary stat-value">{rate}%</span>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="text-text-muted">Collected: <strong className="text-text-primary">{formatCurrency(data?.collected ?? 0)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-surface-border" />
            <span className="text-text-muted">Total Due: <strong className="text-text-primary">{formatCurrency(data?.total_due ?? 0)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
