import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { TrendingUp } from 'lucide-react';

interface RentBenchmarkItem {
  contract_id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  your_rent_annual: number;
  market_estimate_annual: number;
  delta_percent: number;
  area: number;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${value.toLocaleString()}`;
}

export default function RentBenchmark() {
  const { data, isLoading } = useQuery<RentBenchmarkItem[]>({
    queryKey: ['analytics-rent-benchmark'],
    queryFn: () => api.get('/analytics/rent-benchmark'),
  });

  const visible = data?.slice(0, 5) ?? [];
  const hasMore = (data?.length ?? 0) > 5;

  const belowMarket = data?.filter((c) => c.delta_percent < 0) ?? [];
  const revenueOpportunity = belowMarket.reduce(
    (sum, c) => sum + (c.market_estimate_annual - c.your_rent_annual),
    0,
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-surface animate-pulse" />
          <div className="h-4 w-32 rounded bg-surface animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-40 rounded bg-surface animate-pulse" />
              <div className="h-4 w-full rounded bg-surface animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-accent-600" />
        </div>
        <h3 className="text-sm font-medium text-text-primary">Rent vs Market</h3>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">No market comparison data available</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visible.map((item) => {
              const maxVal = Math.max(item.your_rent_annual, item.market_estimate_annual);
              const yourPct = maxVal > 0 ? (item.your_rent_annual / maxVal) * 100 : 0;
              const marketPct = maxVal > 0 ? (item.market_estimate_annual / maxVal) * 100 : 0;
              const isAbove = item.delta_percent >= 0;

              return (
                <div key={item.contract_id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-primary">
                      {item.property_name} — {item.unit_number}
                    </span>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isAbove
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {isAbove ? '+' : ''}
                      {item.delta_percent}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted w-12 shrink-0">Your rent</span>
                      <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all duration-700"
                          style={{ width: `${yourPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-text-secondary w-16 text-right shrink-0">
                        {formatCompact(item.your_rent_annual)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted w-12 shrink-0">Market</span>
                      <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${marketPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-text-secondary w-16 text-right shrink-0">
                        {formatCompact(item.market_estimate_annual)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {belowMarket.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">
                Revenue opportunity: {formatCompact(revenueOpportunity)}/year across{' '}
                {belowMarket.length} unit{belowMarket.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {hasMore && (
            <div className="mt-3 text-center">
              <button className="text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors">
                View all
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
