import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';

interface Property {
  id: number;
  name: string;
}

interface ComparisonProperty {
  id: number;
  name: string;
  type: string;
  emirate: string;
  unit_count: number;
  occupied_count: number;
  total_revenue: number;
  total_expenses: number;
  mortgage_total: number;
  net_income: number;
  occupancy_rate: number;
  avg_rent_per_unit: number;
  roi: number;
}

type MetricKey = keyof Pick<
  ComparisonProperty,
  | 'unit_count'
  | 'occupied_count'
  | 'occupancy_rate'
  | 'total_revenue'
  | 'total_expenses'
  | 'mortgage_total'
  | 'net_income'
  | 'avg_rent_per_unit'
  | 'roi'
>;

interface MetricRow {
  label: string;
  key: MetricKey;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const METRICS: MetricRow[] = [
  { label: 'Units', key: 'unit_count', format: (v) => v.toLocaleString('en-US'), higherIsBetter: true },
  { label: 'Occupied', key: 'occupied_count', format: (v) => v.toLocaleString('en-US'), higherIsBetter: true },
  { label: 'Occupancy %', key: 'occupancy_rate', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
  { label: 'Total Revenue', key: 'total_revenue', format: (v) => formatCurrency(v), higherIsBetter: true },
  { label: 'Total Expenses', key: 'total_expenses', format: (v) => formatCurrency(v), higherIsBetter: false },
  { label: 'Mortgage Payments', key: 'mortgage_total', format: (v) => formatCurrency(v), higherIsBetter: false },
  { label: 'Net Income', key: 'net_income', format: (v) => formatCurrency(v), higherIsBetter: true },
  { label: 'Avg Rent/Unit', key: 'avg_rent_per_unit', format: (v) => formatCurrency(v), higherIsBetter: true },
  { label: 'ROI %', key: 'roi', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
];

const BAR_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function PropertyComparison() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: properties, isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
  });

  const idsParam = selectedIds.join(',');
  const { data: comparison, isLoading: loadingComparison } = useQuery<ComparisonProperty[]>({
    queryKey: ['property-comparison', idsParam],
    queryFn: () => api.get(`/analytics/property-comparison?ids=${idsParam}`),
    enabled: selectedIds.length >= 2,
  });

  function toggleProperty(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  const maxNetIncome = useMemo(() => {
    if (!comparison) return 0;
    return Math.max(...comparison.map((p) => Math.abs(p.net_income)), 1);
  }, [comparison]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-6 w-6 text-text-secondary" />
        <h1 className="text-2xl font-bold text-text-primary">Property Comparison</h1>
      </div>

      {/* Property selector */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm">
        <p className="text-sm font-medium text-text-primary mb-3">
          Select 2-4 properties to compare
        </p>
        {loadingProperties ? (
          <div className="flex gap-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-32 bg-surface rounded-lg" />
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <p className="text-sm text-text-muted">No properties found. Add properties first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isDisabled = !isSelected && selectedIds.length >= 4;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProperty(p.id)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    isSelected
                      ? 'bg-accent-600 text-white border-accent-600'
                      : isDisabled
                      ? 'bg-surface text-text-muted border-surface-border cursor-not-allowed opacity-50'
                      : 'bg-white text-text-primary border-surface-border hover:border-accent-400'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
        {selectedIds.length > 0 && selectedIds.length < 2 && (
          <p className="text-xs text-text-muted mt-2">Select at least one more property</p>
        )}
      </div>

      {/* Comparison table */}
      {selectedIds.length >= 2 && (
        <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden">
          {loadingComparison ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-5 bg-surface rounded w-full" />
              ))}
            </div>
          ) : !comparison || comparison.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-text-muted">No comparison data available</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                        Metric
                      </th>
                      {comparison.map((p) => (
                        <th
                          key={p.id}
                          className="text-right px-4 py-3 text-xs font-medium text-text-secondary"
                        >
                          <Link
                            to={`/properties/${p.id}`}
                            className="hover:text-accent-600 transition-colors"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[10px] text-text-muted font-normal mt-0.5">
                            {p.type} &middot; {p.emirate}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((metric) => {
                      const values = comparison.map((p) => p[metric.key]);
                      const bestVal = metric.higherIsBetter
                        ? Math.max(...values)
                        : Math.min(...values);
                      const worstVal = metric.higherIsBetter
                        ? Math.min(...values)
                        : Math.max(...values);

                      return (
                        <tr
                          key={metric.key}
                          className="border-t border-surface-border"
                        >
                          <td className="px-4 py-2.5 text-text-secondary text-xs font-medium">
                            {metric.label}
                          </td>
                          {comparison.map((p) => {
                            const val = p[metric.key];
                            const isBest = val === bestVal && comparison.length > 1;
                            const isWorst = val === worstVal && comparison.length > 1 && bestVal !== worstVal;
                            return (
                              <td
                                key={p.id}
                                className={`px-4 py-2.5 text-right text-xs ${
                                  isBest
                                    ? 'font-bold text-emerald-600'
                                    : isWorst
                                    ? 'text-text-muted'
                                    : 'text-text-primary'
                                }`}
                              >
                                {metric.format(val)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Net income bar chart */}
              <div className="p-5 border-t border-surface-border">
                <p className="text-xs font-medium text-text-secondary mb-3">
                  Net Income Comparison
                </p>
                <div className="space-y-3">
                  {comparison.map((p, i) => {
                    const widthPercent = Math.max(
                      (Math.abs(p.net_income) / maxNetIncome) * 100,
                      2
                    );
                    const isNegative = p.net_income < 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs text-text-secondary w-28 shrink-0 truncate">
                          {p.name}
                        </span>
                        <div className="flex-1 h-6 bg-surface rounded-md overflow-hidden relative">
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: isNegative ? '#ef4444' : BAR_COLORS[i % BAR_COLORS.length],
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium shrink-0 w-28 text-right ${
                            isNegative ? 'text-red-600' : 'text-text-primary'
                          }`}
                        >
                          {formatCurrency(p.net_income)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
