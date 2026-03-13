import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Property, PROPERTY_TYPE_GROUPS, UAE_EMIRATES } from '../types';
import { formatAddress } from '../utils/formatters';
import { Building2, Plus, MapPin, X } from 'lucide-react';

export default function Properties() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'villa', emirate: 'Dubai' as string,
    city: '', neighborhood: '', street: '', villa_number: '', notes: '',
  });

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/properties', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowForm(false);
      setForm({ name: '', type: 'villa', emirate: 'Dubai', city: '', neighborhood: '', street: '', villa_number: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/properties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <p className="text-text-muted">{properties.length} properties</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 btn-press"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm modal-content">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary">New Property</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-muted"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Name *</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Property name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Type *</label>
              <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(PROPERTY_TYPE_GROUPS).map(([group, types]) => (
                  <optgroup key={group} label={group}>
                    {types.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Emirate *</label>
              <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.emirate} onChange={e => setForm({ ...form, emirate: e.target.value })}>
                {UAE_EMIRATES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">City / Area</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g., Jumeirah, Business Bay" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Neighborhood</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="e.g., Al Wasl, Marina" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Street</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="e.g., Al Wasl Road" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Villa / Building #</label>
              <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={form.villa_number} onChange={e => setForm({ ...form, villa_number: e.target.value })} placeholder="e.g., Villa 5, Building 12" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
              <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.emirate}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors active:scale-95"
            >
              Create Property
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Property List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-surface-border p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-4" />
              <div className="flex gap-4">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No properties yet. Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop, i) => (
            <Link key={prop.id} to={`/properties/${prop.id}`} className="bg-white rounded-xl border border-surface-border p-5 card-hover animate-fade-in" style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">{prop.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {formatAddress(prop)}
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface-overlay text-text-muted capitalize">{prop.type.replace('_', ' ')}</span>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Units:</span>{' '}
                  <span className="font-medium text-text-primary">{prop.unit_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-text-muted">Occupied:</span>{' '}
                  <span className="font-medium text-emerald-600">{prop.occupied_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-text-muted">Vacant:</span>{' '}
                  <span className="font-medium text-amber-600">{(prop.unit_count ?? 0) - (prop.occupied_count ?? 0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
