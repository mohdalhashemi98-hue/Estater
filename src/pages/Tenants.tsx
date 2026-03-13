import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Tenant } from '../types';
import { Users, Plus, X, Phone, Mail, Building } from 'lucide-react';

export default function Tenants() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', id_number: '', company_name: '', notes: '' });

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowForm(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', id_number: '', company_name: '', notes: '' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <p className="text-text-muted">{tenants.length} tenants</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm transition-all duration-200 btn-press">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm modal-content">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary">New Tenant</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">First Name *</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Last Name *</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Phone *</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
              <input type="email" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">ID / Passport Number</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Company Name</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
              <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 outline-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.first_name || !form.last_name || !form.phone}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm disabled:opacity-50 transition-colors active:scale-95"
            >
              Create Tenant
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-1/6" />
                <div className="skeleton h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No tenants yet. Add your first tenant.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Contact</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Company</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Active Contracts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {tenants.map((t, i) => (
                <tr key={t.id} className="hover:bg-surface transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <td className="px-4 py-3">
                    <Link to={`/tenants/${t.id}`} className="font-medium text-accent-600 hover:underline">
                      {t.first_name} {t.last_name}
                    </Link>
                    {t.id_number && <p className="text-xs text-text-muted">ID: {t.id_number}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-text-muted"><Phone className="w-3.5 h-3.5" /> {t.phone}</div>
                    {t.email && <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5"><Mail className="w-3 h-3" /> {t.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {t.company_name ? <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {t.company_name}</span> : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(t.active_contracts ?? 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-text-muted'}`}>
                      {t.active_contracts ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
