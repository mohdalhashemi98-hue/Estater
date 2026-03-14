import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Users, Plus, X, Search, Phone, Mail, Building, MessageCircle, Shield } from 'lucide-react';

interface EnrichedTenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company_name: string;
  id_number: string;
  notes: string;
  active_contracts: number;
  current_property: string | null;
  current_unit: string | null;
  monthly_rent: number;
  total_payments: number;
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  on_time_rate: number;
  outstanding_balance: number;
  last_payment_date: string | null;
  risk_score: 'low' | 'medium' | 'high';
}

type RiskFilter = 'all' | 'low' | 'medium' | 'high';
type StatusFilter = 'all' | 'active' | 'inactive';

const RISK_BADGE: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

const RISK_LABELS: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

function rateColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600';
  if (rate >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function rateBarColor(rate: number): string {
  if (rate >= 90) return 'bg-emerald-500';
  if (rate >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function Tenants() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: '',
    company_name: '',
    notes: '',
  });

  const { data: tenants = [], isLoading } = useQuery<EnrichedTenant[]>({
    queryKey: ['tenants', 'enriched'],
    queryFn: () => api.get('/tenants/enriched'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowForm(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', id_number: '', company_name: '', notes: '' });
      toast.success('Tenant created');
    },
    onError: () => {
      toast.error('Failed to create tenant');
    },
  });

  // Client-side filtering
  const filtered = tenants.filter((t) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
      const match =
        fullName.includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.company_name && t.company_name.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Risk filter
    if (riskFilter !== 'all' && t.risk_score !== riskFilter) return false;

    // Status filter
    if (statusFilter === 'active' && t.active_contracts === 0) return false;
    if (statusFilter === 'inactive' && t.active_contracts > 0) return false;

    return true;
  });

  const inputClass =
    'w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none transition-colors';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">Tenants</h1>
          <span className="text-sm text-text-muted bg-surface px-2.5 py-0.5 rounded-full border border-surface-border">
            {tenants.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm transition-all duration-200 btn-press"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 animate-fade-in">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-surface-border rounded-lg text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Risk filter */}
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary mr-1">Risk:</span>
            {(['all', 'low', 'medium', 'high'] as RiskFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  riskFilter === r
                    ? r === 'all'
                      ? 'bg-accent-600 text-white border-accent-600'
                      : r === 'low'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : r === 'medium'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-white text-text-secondary border-surface-border hover:bg-surface'
                }`}
              >
                {r === 'all' ? 'All' : RISK_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary mr-1">Status:</span>
            {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-accent-600 text-white border-accent-600'
                    : 'bg-white text-text-secondary border-surface-border hover:bg-surface'
                }`}
              >
                {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Tenant Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm modal-content">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary text-lg">New Tenant</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">First Name *</label>
              <input
                className={inputClass}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Last Name *</label>
              <input
                className={inputClass}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Phone *</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">ID / Passport Number</label>
              <input
                className={inputClass}
                value={form.id_number}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
              <input
                className={inputClass}
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.first_name || !form.last_name || !form.phone || createMutation.isPending}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm disabled:opacity-50 transition-colors active:scale-95"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-border p-5 shadow-sm space-y-3">
              <div className="flex justify-between">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && tenants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-surface-border shadow-sm">
          <Users className="w-14 h-14 text-text-muted mx-auto mb-4" />
          <p className="text-lg font-medium text-text-primary mb-1">No tenants yet</p>
          <p className="text-text-muted">Add your first tenant to get started.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border shadow-sm">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No tenants match your filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-surface-border p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
            >
              {/* Header: Name + Risk badge */}
              <div className="flex items-start justify-between mb-3">
                <Link
                  to={`/tenants/${t.id}`}
                  className="font-semibold text-text-primary hover:text-accent-600 transition-colors"
                >
                  {t.first_name} {t.last_name}
                </Link>
                {t.risk_score && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_BADGE[t.risk_score] || RISK_BADGE.low}`}
                  >
                    {RISK_LABELS[t.risk_score] || t.risk_score}
                  </span>
                )}
              </div>

              {/* Property info */}
              <div className="mb-3">
                {t.current_property ? (
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {t.current_property}
                      {t.current_unit ? ` - ${t.current_unit}` : ''}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No active lease</p>
                )}
              </div>

              {/* Contact row */}
              <div className="flex items-center gap-3 mb-3 text-sm">
                {t.phone && (
                  <a
                    href={`tel:${t.phone}`}
                    className="flex items-center gap-1 text-text-secondary hover:text-accent-600 transition-colors"
                    title={t.phone}
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[100px]">{t.phone}</span>
                  </a>
                )}
                {t.email && (
                  <a
                    href={`mailto:${t.email}`}
                    className="flex items-center gap-1 text-text-secondary hover:text-accent-600 transition-colors"
                    title={t.email}
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[100px]">{t.email}</span>
                  </a>
                )}
                {t.phone && (
                  <a
                    href={`https://wa.me/${t.phone.replace(/[\s+\-()]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary hover:text-emerald-600 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Financial row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Monthly Rent</p>
                  <p className="text-sm font-medium text-text-primary">
                    {t.monthly_rent ? `${formatCurrency(t.monthly_rent)}/mo` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Outstanding</p>
                  {t.outstanding_balance > 0 ? (
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(t.outstanding_balance)}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-emerald-600">Paid up</p>
                  )}
                </div>
              </div>

              {/* Payment bar */}
              {t.total_payments > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${rateColor(t.on_time_rate)}`}>
                      {Math.round(t.on_time_rate)}% on-time
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rateBarColor(t.on_time_rate)}`}
                      style={{ width: `${Math.min(t.on_time_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {t.on_time_payments} on-time, {t.late_payments} late, {t.missed_payments} missed
                  </p>
                </div>
              )}

              {/* Last payment date */}
              {t.last_payment_date && (
                <p className="text-xs text-text-muted border-t border-surface-border pt-2">
                  Last paid: {formatDate(t.last_payment_date)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
