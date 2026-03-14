import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { toast } from 'sonner';
import { Wrench, Plus, X, AlertTriangle } from 'lucide-react';

interface Property {
  id: number;
  name: string;
}

interface MaintenanceSummary {
  reported: number;
  in_progress: number;
  resolved: number;
  cancelled: number;
  total: number;
}

interface MaintenanceRequest {
  id: number;
  property_id: number;
  property_name?: string;
  unit_number?: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  cost?: number;
  vendor_name?: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'ac_hvac', label: 'AC / HVAC' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'painting', label: 'Painting' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'general', label: 'General' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'reported', label: 'Reported' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
];

function categoryLabel(value: string): string {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}

function priorityBadge(priority: string) {
  const styles: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-amber-100 text-amber-700',
    medium: 'bg-accent-100 text-accent-700',
    low: 'bg-surface-overlay text-text-secondary',
  };
  const label = PRIORITIES.find(p => p.value === priority)?.label || priority;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority] || styles.low}`}>{label}</span>;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    reported: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-accent-100 text-accent-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-text-muted',
  };
  const label = STATUSES.find(s => s.value === status)?.label || status;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.reported}`}>{label}</span>;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Maintenance() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveData, setResolveData] = useState({ cost: '', vendor_name: '' });

  const [form, setForm] = useState({
    property_id: '',
    title: '',
    category: 'general',
    priority: 'medium',
    description: '',
  });

  const queryStr = statusFilter ? `?status=${statusFilter}` : '';

  const { data: requests = [] } = useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance', statusFilter],
    queryFn: () => api.get(`/maintenance${queryStr}`),
  });

  const { data: summary } = useQuery<MaintenanceSummary>({
    queryKey: ['maintenance-summary'],
    queryFn: () => api.get('/maintenance/summary'),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['maintenance'] });
    qc.invalidateQueries({ queryKey: ['maintenance-summary'] });
  };

  const createMut = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/maintenance', { ...data, property_id: Number(data.property_id) }),
    onSuccess: () => {
      toast.success('Maintenance request created');
      invalidate();
      setShowForm(false);
      setForm({ property_id: '', title: '', category: 'general', priority: 'medium', description: '' });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create request'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      api.put(`/maintenance/${id}`, data),
    onSuccess: () => {
      toast.success('Request updated');
      invalidate();
      setResolvingId(null);
      setResolveData({ cost: '', vendor_name: '' });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update request'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.del(`/maintenance/${id}`),
    onSuccess: () => {
      toast.success('Request deleted');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete request'),
  });

  function handleStatusChange(req: MaintenanceRequest, newStatus: string) {
    if (newStatus === 'resolved' && !req.cost) {
      setResolvingId(req.id);
      setResolveData({ cost: '', vendor_name: '' });
    } else {
      updateMut.mutate({ id: req.id, data: { status: newStatus } });
    }
  }

  function handleResolveSubmit(id: number) {
    updateMut.mutate({
      id,
      data: {
        status: 'resolved',
        ...(resolveData.cost ? { cost: Number(resolveData.cost) } : {}),
        ...(resolveData.vendor_name ? { vendor_name: resolveData.vendor_name } : {}),
      },
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.property_id || !form.title || !form.category) return;
    createMut.mutate(form);
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Maintenance</h1>
          <p className="text-sm text-text-muted mt-0.5">Track and manage maintenance requests</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={() => setShowForm(v => !v)}
            className="pill-btn bg-accent-600 text-white hover:bg-accent-700 shadow-sm btn-press"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Reported', value: summary.reported, color: 'text-amber-600' },
            { label: 'In Progress', value: summary.in_progress, color: 'text-accent-600' },
            { label: 'Resolved', value: summary.resolved, color: 'text-emerald-600' },
            { label: 'Total', value: summary.total, color: 'text-text-primary' },
          ].map((stat, i) => (
            <div key={stat.label} className={`bg-white rounded-xl border border-surface-border p-4 shadow-sm card-hover animate-fade-in animate-stagger-${i + 1}`}>
              <p className="text-xs text-text-muted font-medium">{stat.label}</p>
              <p className={`text-xl font-semibold mt-1 stat-value ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-4 animate-fade-in"
        >
          <h2 className="text-lg font-semibold text-text-primary">New Maintenance Request</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Property *</label>
              <select
                required
                value={form.property_id}
                onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
              >
                <option value="">Select property</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category *</label>
              <select
                required
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Additional details (optional)"
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold text-sm disabled:opacity-50"
            >
              {createMut.isPending ? 'Creating...' : 'Create Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-overlay"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Request Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm animate-fade-in animate-stagger-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Title</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Property / Unit</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Category</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Priority</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Reported</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-b border-surface row-hover table-row-enter">
                  <td className="px-4 py-3 text-text-primary font-medium">
                    <div className="flex items-center gap-2">
                      {req.priority === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      {req.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {req.property_name || `Property #${req.property_id}`}
                    {req.unit_number ? ` — ${req.unit_number}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-overlay text-text-secondary">
                      {categoryLabel(req.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{priorityBadge(req.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(req.status)}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {resolvingId === req.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Cost"
                            value={resolveData.cost}
                            onChange={e => setResolveData(d => ({ ...d, cost: e.target.value }))}
                            className="w-20 border border-surface-border rounded px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Vendor"
                            value={resolveData.vendor_name}
                            onChange={e => setResolveData(d => ({ ...d, vendor_name: e.target.value }))}
                            className="w-24 border border-surface-border rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleResolveSubmit(req.id)}
                            disabled={updateMut.isPending}
                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="text-xs text-text-muted hover:text-text-secondary"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <select
                            value={req.status}
                            onChange={e => handleStatusChange(req, e.target.value)}
                            className="text-xs border border-surface-border rounded px-2 py-1 bg-white"
                          >
                            {STATUSES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (confirm('Delete this maintenance request?')) deleteMut.mutate(req.id);
                            }}
                            className="p-1 text-text-muted hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Wrench className="w-10 h-10 text-text-muted" />
                      <p className="text-text-muted font-medium">No maintenance requests</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                      >
                        Create your first request
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
