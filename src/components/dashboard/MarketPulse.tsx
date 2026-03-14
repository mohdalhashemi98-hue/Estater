import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Transaction {
  area: string;
  building: string;
  actual_worth: number;
  meter_sale_price: number;
  transaction_date: string;
  property_type: string;
  rooms: string;
}

interface Trend {
  current_avg: number;
  prev_avg: number;
  change_percent: number;
  direction: 'up' | 'down' | 'flat';
}

interface TopArea {
  area: string;
  count: number;
  avg_price_sqm: number;
}

interface MarketPulseData {
  recent_transactions: Transaction[];
  trend: Trend;
  top_areas: TopArea[];
}

function TrendArrow({ direction, percent }: { direction: Trend['direction']; percent: number }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 text-sm font-medium">
        <TrendingUp className="h-4 w-4" />
        +{percent.toFixed(1)}%
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 text-sm font-medium">
        <TrendingDown className="h-4 w-4" />
        -{Math.abs(percent).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-text-muted text-sm font-medium">
      <Minus className="h-4 w-4" />
      0.0%
    </span>
  );
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MarketPulse() {
  const { data, isLoading } = useQuery<MarketPulseData>({
    queryKey: ['analytics-market-pulse'],
    queryFn: () => api.get('/analytics/market-pulse'),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-text-primary">Market Pulse</h3>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-surface rounded" />
            <div className="h-4 w-24 bg-surface rounded" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-24 bg-surface rounded-full" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-surface rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.recent_transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-text-primary">Market Pulse</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">
            No market data available — configure DLD in Settings
          </p>
        </div>
      </div>
    );
  }

  const { trend, top_areas, recent_transactions } = data;
  const recentFive = recent_transactions.slice(0, 5);
  const topThree = top_areas.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-medium text-text-primary">Market Pulse</h3>
      </div>

      {/* Trend indicator */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-text-primary">
            AED {Math.round(trend.current_avg).toLocaleString('en-US')}
          </span>
          <span className="text-sm text-text-secondary">/sqm</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <TrendArrow direction={trend.direction} percent={trend.change_percent} />
          <span className="text-xs text-text-muted">vs 30-day avg</span>
        </div>
      </div>

      {/* Top Areas */}
      {topThree.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-text-secondary mb-2">Top Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {topThree.map((area) => (
              <span
                key={area.area}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs text-text-primary border border-surface-border"
              >
                {area.area}
                <span className="text-text-muted">
                  AED {Math.round(area.avg_price_sqm).toLocaleString('en-US')}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Recent Transactions</p>
        <div className="space-y-1.5">
          {recentFive.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs gap-2"
            >
              <span className="text-text-primary truncate flex-1 min-w-0">{tx.area}</span>
              <span className="text-text-muted shrink-0">{tx.property_type}</span>
              <span className="text-text-primary font-medium shrink-0">
                {formatCurrency(tx.actual_worth)}
              </span>
              <span className="text-text-muted shrink-0">{formatShortDate(tx.transaction_date)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View all link */}
      <div className="mt-4 pt-3 border-t border-surface-border">
        <Link
          to="/market"
          className="text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
    </div>
  );
}
