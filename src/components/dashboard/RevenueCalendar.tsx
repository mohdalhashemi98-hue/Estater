import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DayData {
  date: string;
  amount: number;
  count: number;
}

interface MonthData {
  month: string;
  total_collected: number;
  days: DayData[];
}

interface RevenueCalendarResponse {
  year: number;
  months: MonthData[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  if (value > 0) return `AED ${value}`;
  return '—';
}

export default function RevenueCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery<RevenueCalendarResponse>({
    queryKey: ['revenue-calendar', year],
    queryFn: () => api.get(`/analytics/revenue-calendar?year=${year}`),
  });

  const months = data?.months ?? [];
  const maxCollected = Math.max(...months.map((m) => m.total_collected), 1);
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() : -1;

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Revenue Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1 rounded-md hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
          <span className="text-sm font-semibold text-text-primary w-12 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1 rounded-md hover:bg-surface transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Bar chart */}
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-3 bg-surface rounded animate-pulse" />
              <div className="flex-1 h-5 bg-surface rounded animate-pulse" />
              <div className="w-14 h-3 bg-surface rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {MONTH_LABELS.map((label, idx) => {
            const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
            const monthData = months.find((m) => m.month === monthKey);
            const collected = monthData?.total_collected ?? 0;
            const barWidth = maxCollected > 0 ? (collected / maxCollected) * 100 : 0;
            const isCurrent = idx === currentMonth;

            return (
              <div
                key={monthKey}
                className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
                }`}
              >
                <span className="text-xs text-text-secondary w-8 shrink-0 font-medium">
                  {label}
                </span>
                <div className="flex-1 h-5 bg-surface rounded-md overflow-hidden">
                  {barWidth > 0 && (
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-text-muted w-16 text-right shrink-0 tabular-nums">
                  {collected > 0 ? formatCompact(collected) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
