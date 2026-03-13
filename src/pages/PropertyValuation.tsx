import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Property, PropertyValuation as PropertyValuationType } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StockTicker from '../components/ui/StockTicker';
import ValuationChart from '../components/charts/ValuationChart';
import ValuationForm from '../components/valuation/ValuationForm';
import { ArrowLeft, Plus, Trash2, Globe, Loader2, TrendingUp } from 'lucide-react';

export default function PropertyValuation() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const { data: property } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`),
  });

  const { data: valuations = [], isLoading } = useQuery<PropertyValuationType[]>({
    queryKey: ['valuations', id],
    queryFn: () => api.get(`/properties/${id}/valuations`),
  });

  const deleteMutation = useMutation({
    mutationFn: (valId: number) => api.del(`/valuations/${valId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: () => api.post(`/properties/${id}/valuations/scrape`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });

  const chartData = [...valuations]
    .sort((a, b) => a.valuation_date.localeCompare(b.valuation_date))
    .map(v => ({ date: v.valuation_date, value: v.estimated_value }));

  // Add purchase price as first data point if available
  if (property?.purchase_price && property?.purchase_date) {
    const purchasePoint = { date: property.purchase_date, value: property.purchase_price };
    if (!chartData.find(d => d.date === property.purchase_date)) {
      chartData.unshift(purchasePoint);
    }
  }

  const currentValue = property?.current_estimated_value || (valuations[0]?.estimated_value) || 0;

  return (
    <div className="space-y-6">
      <Link to="/portfolio" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Portfolio
      </Link>

      {/* Stock-ticker header */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm animate-fade-in">
        <StockTicker
          label={property?.name || 'Property'}
          currentValue={currentValue}
          previousValue={property?.purchase_price}
          hoverValue={hoverValue}
          hoverDate={hoverDate ? formatDate(hoverDate) : null}
        />

        {/* Chart */}
        {chartData.length > 1 ? (
          <div className="mt-6">
            <ValuationChart
              data={chartData}
              purchasePrice={property?.purchase_price}
              onHover={(val, date) => {
                setHoverValue(val);
                setHoverDate(date);
              }}
              height={350}
            />
          </div>
        ) : (
          <div className="mt-6 text-center py-12 border-2 border-dashed border-surface-border rounded-lg">
            <p className="text-text-muted">Add at least 2 valuations to see the chart.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 text-sm font-semibold shadow-sm hover:shadow transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Valuation
        </button>
        {(property?.zillow_url || property?.redfin_url) && (
          <button
            onClick={() => scrapeMutation.mutate()}
            disabled={scrapeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-surface-border text-text-muted hover:bg-surface disabled:opacity-50 transition-colors"
          >
            {scrapeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Scrape Latest Value
          </button>
        )}
      </div>

      {scrapeMutation.isSuccess && (
        <div className="bg-success-50 border border-green-200 rounded-lg p-3 text-sm text-success-700">
          {(scrapeMutation.data as any)?.estimated_value
            ? `Scraped value: ${formatCurrency((scrapeMutation.data as any).estimated_value)}`
            : (scrapeMutation.data as any)?.message || 'Scrape completed'}
        </div>
      )}

      {showForm && (
        <ValuationForm propertyId={Number(id)} onClose={() => setShowForm(false)} />
      )}

      {/* Valuation History Table */}
      {valuations.length > 0 ? (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-surface-border">
            <h3 className="font-semibold text-text-primary">Valuation History</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Value</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Source</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Confidence</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Notes</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {valuations.map((v, i) => (
                <tr key={v.id} className="hover:bg-surface transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <td className="px-4 py-3 text-text-primary">{formatDate(v.valuation_date)}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary">{formatCurrency(v.estimated_value)}</td>
                  <td className="px-4 py-3 text-text-muted capitalize">{v.source}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      v.confidence === 'high' ? 'bg-success-50 text-success-700' :
                      v.confidence === 'medium' ? 'bg-warning-50 text-warning-700' :
                      'bg-surface text-text-muted'
                    }`}>
                      {v.confidence}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{v.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (confirm('Delete this valuation?')) deleteMutation.mutate(v.id); }}
                      className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !isLoading && (
        <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
          <TrendingUp className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No valuations recorded yet. Add your first valuation above.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-surface-border border-t-accent-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
