import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Tenant } from '../types';
import { formatCurrency, formatDate, statusColor, frequencyLabel } from '../utils/formatters';
import { ArrowLeft, Phone, Mail, Building, CreditCard, FileText, Pencil, Trash2, Check, X } from 'lucide-react';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', id_number: '', company_name: '', notes: '' });

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/tenants/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate('/tenants');
    },
  });

  const startEditing = () => {
    if (!tenant) return;
    setEditForm({
      first_name: tenant.first_name, last_name: tenant.last_name,
      email: tenant.email || '', phone: tenant.phone || '',
      id_number: tenant.id_number || '', company_name: tenant.company_name || '',
      notes: tenant.notes || '',
    });
    setEditing(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-surface-border border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
  if (!tenant) return <p className="text-danger-600">Tenant not found</p>;

  return (
    <div className="space-y-6">
      <Link to="/tenants" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm animate-fade-in">
        {editing ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Edit Tenant</h2>
              <button onClick={() => setEditing(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">First Name *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Last Name *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Phone *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                <input type="email" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">ID Number</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.id_number} onChange={e => setEditForm({ ...editForm, id_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Company</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
                <textarea rows={2} className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            {updateMutation.isError && <p className="mt-2 text-sm text-danger-600">{(updateMutation.error as any)?.message || 'Update failed'}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.first_name || !editForm.last_name || !editForm.phone || updateMutation.isPending} className="flex items-center gap-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">{tenant.first_name} {tenant.last_name}</h2>
              <div className="flex gap-2">
                <button onClick={startEditing} className="p-2 text-text-muted hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Delete this tenant? This cannot be undone.')) deleteMutation.mutate(); }} className="p-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {deleteMutation.isError && <p className="mt-2 text-sm text-danger-600">{(deleteMutation.error as any)?.message || 'Cannot delete tenant with active contracts'}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {tenant.phone}</span>
              {tenant.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {tenant.email}</span>}
              {tenant.company_name && <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {tenant.company_name}</span>}
              {tenant.id_number && <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> ID: {tenant.id_number}</span>}
            </div>
            {tenant.notes && <p className="mt-3 text-sm text-text-muted">{tenant.notes}</p>}
          </>
        )}
      </div>

      <h3 className="text-lg font-semibold text-text-primary">Contract History ({tenant.contracts?.length || 0})</h3>

      {tenant.contracts && tenant.contracts.length > 0 ? (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Property / Unit</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Period</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Rent</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Frequency</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {tenant.contracts.map((c, i) => (
                <tr key={c.id} className="hover:bg-surface transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <td className="px-4 py-3">
                    <Link to={`/contracts/${c.id}`} className="font-medium text-accent-600 hover:underline">
                      {c.property_name} - {c.unit_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(c.start_date)} - {formatDate(c.end_date)}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(c.rent_amount)}</td>
                  <td className="px-4 py-3 text-text-muted">{frequencyLabel(c.payment_frequency)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
          <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted">No contracts for this tenant.</p>
        </div>
      )}
    </div>
  );
}
