import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PortfolioSummary as PortfolioSummaryType } from '../types';
import { formatCurrency } from '../utils/formatters';
import PortfolioSummaryComponent from '../components/valuation/PortfolioSummary';
import GainLossIndicator from '../components/ui/GainLossIndicator';
import { Building2, ArrowRight, TrendingUp } from 'lucide-react';

export default function Portfolio() {
  const { data: portfolio, isLoading } = useQuery<PortfolioSummaryType>({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/valuations/portfolio'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-surface-border border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
  if (!portfolio) return <p className="text-text-muted">No portfolio data yet.</p>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-[-0.02em]">Portfolio Overview</h2>
          <p className="text-sm text-text-muted mt-0.5">Track your property values and overall performance</p>
        </div>
      </div>

      <PortfolioSummaryComponent data={portfolio} />

      {/* Property Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolio.properties.map((prop, i) => (
          <Link
            key={prop.id}
            to={`/properties/${prop.id}/valuation`}
            className="bg-white rounded-xl border border-surface-border p-5 hover:shadow-md hover:border-surface-border transition-all group animate-fade-in"
            style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{prop.name}</h3>
                  {prop.last_updated && (
                    <p className="text-xs text-text-muted">Updated {prop.last_updated}</p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-600 transition-colors" />
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-2xl font-semibold text-text-primary tabular-nums">
                  {formatCurrency(prop.current_value)}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Purchase: {formatCurrency(prop.purchase_price)}</span>
                <GainLossIndicator value={prop.gain_loss} percent={prop.gain_loss_percent} size="sm" />
              </div>

              {/* Mini progress bar */}
              <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${prop.gain_loss >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(prop.gain_loss_percent), 100)}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {portfolio.properties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No property valuations yet.</p>
          <p className="text-sm text-text-muted mt-1">Add purchase prices and valuations to your properties to see portfolio performance.</p>
        </div>
      )}
    </div>
  );
}
