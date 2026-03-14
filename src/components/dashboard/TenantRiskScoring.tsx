import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TenantRisk {
  tenant_id: string;
  tenant_name: string;
  total_payments: number;
  on_time: number;
  late: number;
  missed: number;
  on_time_rate: number;
  risk_score: number;
  avg_days_late: number;
  active_contracts: number;
}

function getRiskLevel(score: number): { label: string; color: string; barColor: string; bgColor: string } {
  if (score >= 70) return { label: 'High', color: 'text-red-600', barColor: 'bg-red-400', bgColor: 'bg-red-50' };
  if (score >= 40) return { label: 'Medium', color: 'text-amber-600', barColor: 'bg-amber-400', bgColor: 'bg-amber-50' };
  return { label: 'Low', color: 'text-emerald-600', barColor: 'bg-emerald-400', bgColor: 'bg-emerald-50' };
}

function RiskBadge({ score }: { score: number }) {
  const { label, color, bgColor } = getRiskLevel(score);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${color} ${bgColor}`}>
      {label}
    </span>
  );
}

export default function TenantRiskScoring() {
  const { data, isLoading } = useQuery<TenantRisk[]>({
    queryKey: ['tenant-risk'],
    queryFn: () => api.get('/analytics/tenant-risk'),
  });

  const tenants = data ?? [];
  const highRiskCount = tenants.filter((t) => t.risk_score >= 70).length;
  const displayTenants = tenants.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-medium text-text-primary">Tenant Risk</h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-28 h-3 bg-surface rounded animate-pulse" />
                <div className="w-12 h-4 bg-surface rounded-full animate-pulse" />
              </div>
              <div className="w-full h-1.5 bg-surface rounded animate-pulse" />
              <div className="w-36 h-2.5 bg-surface rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">Add contracts to see tenant risk scores</p>
        </div>
      ) : (
        <>
          {/* High risk warning */}
          {highRiskCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-xs font-medium text-red-700">
                {highRiskCount} tenant{highRiskCount > 1 ? 's' : ''} need{highRiskCount === 1 ? 's' : ''} attention
              </span>
            </div>
          )}

          {/* Tenant rows */}
          <div className="space-y-3">
            {displayTenants.map((tenant) => {
              const risk = getRiskLevel(tenant.risk_score);
              return (
                <div key={tenant.tenant_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate max-w-[60%]">
                      {tenant.tenant_name}
                    </span>
                    <RiskBadge score={tenant.risk_score} />
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${risk.barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(tenant.on_time_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {tenant.on_time} on-time, {tenant.late} late, {tenant.missed} missed
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer link */}
          <Link
            to="/tenants"
            className="block text-center text-xs font-medium text-text-muted hover:text-text-primary mt-4 pt-3 border-t border-surface-border transition-colors"
          >
            View all tenants
          </Link>
        </>
      )}
    </div>
  );
}
