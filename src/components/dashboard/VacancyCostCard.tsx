import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { Home } from 'lucide-react';

export default function VacancyCostCard() {
  const { data } = useQuery<{ vacant_units: any[]; total_monthly_loss: number }>({
    queryKey: ['dashboard-vacancy-cost'],
    queryFn: () => api.get('/dashboard/vacancy-cost'),
  });

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-2">
      <h3 className="text-sm font-medium text-text-primary mb-4">Vacancy Cost</h3>
      {data && data.vacant_units.length > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Home className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600 stat-value">{formatCurrency(data.total_monthly_loss)}</p>
              <p className="text-xs text-text-muted">Estimated monthly loss</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.vacant_units.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-surface">
                <span className="text-text-secondary">{u.property_name} — {u.unit_number}</span>
                <span className="text-text-primary font-medium">{u.last_rent ? formatCurrency(u.last_rent) : 'N/A'}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-emerald-600 font-medium">All units occupied!</p>
        </div>
      )}
    </div>
  );
}
