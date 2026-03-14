import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

interface PortfolioHealth {
  overall: number;
  occupancy: { score: number; occupied: number; total: number };
  collection: { score: number; paid: number; total: number };
  market_fit: { score: number };
  maintenance: { score: number; open_requests: number };
  expiry: { score: number; expiring_soon: number; active: number };
}

interface BreakdownItem {
  label: string;
  score: number;
  detail?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function ringStroke(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function PortfolioHealthScore() {
  const { data, isLoading } = useQuery<PortfolioHealth>({
    queryKey: ['analytics-portfolio-health'],
    queryFn: () => api.get('/analytics/portfolio-health'),
  });

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
        <h3 className="text-sm font-medium text-text-primary mb-4">Portfolio Health</h3>
        <div className="flex justify-center mb-5">
          <div className="w-32 h-32 rounded-full bg-surface animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-surface animate-pulse" />
              <div className="h-2 w-full rounded bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
        <h3 className="text-sm font-medium text-text-primary mb-4">Portfolio Health</h3>
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">Add properties to see health score</p>
        </div>
      </div>
    );
  }

  const overall = data.overall;
  const offset = circumference - (overall / 100) * circumference;

  const breakdowns: BreakdownItem[] = [
    { label: 'Occupancy', score: data.occupancy.score },
    { label: 'Collection', score: data.collection.score },
    { label: 'Market Fit', score: data.market_fit.score },
    { label: 'Maintenance', score: data.maintenance.score },
    { label: 'Expiry Risk', score: data.expiry.score },
  ];

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
      <h3 className="text-sm font-medium text-text-primary mb-4">Portfolio Health</h3>

      <div className="flex justify-center mb-5">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#ede9de"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={ringStroke(overall)}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor(overall)}`}>{overall}</span>
            <span className="text-[10px] text-text-muted">/ 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {breakdowns.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">{item.label}</span>
              <span className={`text-[11px] font-semibold ${scoreColor(item.score)}`}>
                {item.score}
              </span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(item.score)}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
