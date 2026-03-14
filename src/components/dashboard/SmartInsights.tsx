import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Lightbulb } from 'lucide-react';

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  icon: string;
  text: string;
}

const dotColor: Record<Insight['type'], string> = {
  positive: 'bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export default function SmartInsights() {
  const { data, isLoading } = useQuery<Insight[]>({
    queryKey: ['analytics-insights'],
    queryFn: () => api.get('/analytics/insights'),
  });

  const insights = (data ?? []).slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium text-text-primary">Smart Insights</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-surface shrink-0" />
              <div className="h-4 bg-surface rounded w-full" />
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">
          Insights will appear as you add more data
        </p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li
              key={insight.id}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor[insight.type]}`}
              />
              <span className="text-sm text-text-primary">{insight.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
