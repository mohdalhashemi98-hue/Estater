import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api/client';
import { Tenant, Contract, Payment } from '../types';
import { formatCurrency, formatDate, statusColor, frequencyLabel, daysUntil } from '../utils/formatters';
import { ArrowLeft, Phone, Mail, Building, CreditCard, FileText, Pencil, Trash2, Check, X, MessageCircle, Calendar, Upload, Stamp, Landmark } from 'lucide-react';
import TenantInsights from '../components/analytics/TenantInsights';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentGrid from '../components/documents/DocumentGrid';

type Tab = 'overview' | 'payments' | 'contracts' | 'documents';

function collectPayments(contracts: Contract[]): (Payment & { contract_id: number; property_name?: string; unit_number?: string })[] {
  const all: (Payment & { contract_id: number; property_name?: string; unit_number?: string })[] = [];
  for (const c of contracts) {
    if (c.payments) {
      for (const p of c.payments) {
        all.push({ ...p, contract_id: c.id, property_name: c.property_name, unit_number: c.unit_number });
      }
    }
  }
  return all.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
      toast.success('Tenant updated');
    },
    onError: () => {
      toast.error('Failed to update tenant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate('/tenants');
      toast.success('Tenant deleted');
    },
    onError: () => {
      toast.error('Failed to delete tenant');
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

  const contracts = tenant.contracts || [];
  const activeContracts = contracts.filter(c => c.status === 'active');
  const allPayments = collectPayments(contracts);
  const paidPayments = allPayments.filter(p => p.status === 'paid');
  const overduePayments = allPayments.filter(p => p.status === 'overdue');
  const pendingPayments = allPayments.filter(p => p.status === 'pending');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = [...overduePayments, ...pendingPayments].reduce((sum, p) => sum + p.amount, 0);
  const onTimeRate = allPayments.length > 0 ? Math.round((paidPayments.length / allPayments.length) * 100) : null;

  const initials = `${tenant.first_name.charAt(0)}${tenant.last_name.charAt(0)}`.toUpperCase();
  const fullName = `${tenant.first_name} ${tenant.last_name}`;
  const phoneClean = tenant.phone?.replace(/\s+/g, '') || '';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'payments', label: 'Payments' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'documents', label: 'Documents' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/tenants" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm animate-fade-in">
        {editing ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Edit Tenant</h2>
              <button onClick={() => setEditing(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">First Name *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Last Name *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input type="email" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">ID Number</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.id_number} onChange={e => setEditForm({ ...editForm, id_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Company</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
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
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Left: Avatar + Info */}
            <div className="flex-1 flex gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-text-primary">{fullName}</h2>

                {/* Contact action pills */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {tenant.phone && (
                    <a href={`tel:${phoneClean}`} className="inline-flex items-center gap-1.5 bg-surface rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-overlay transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {tenant.phone}
                    </a>
                  )}
                  {tenant.email && (
                    <a href={`mailto:${tenant.email}`} className="inline-flex items-center gap-1.5 bg-surface rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-overlay transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {tenant.email}
                    </a>
                  )}
                  {tenant.phone && (
                    <a href={`https://wa.me/${phoneClean.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-surface rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-overlay transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                </div>

                {/* Company + ID */}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-muted">
                  {tenant.company_name && (
                    <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {tenant.company_name}</span>
                  )}
                  {tenant.id_number && (
                    <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> ID: {tenant.id_number}</span>
                  )}
                </div>

                {/* Notes */}
                {tenant.notes && (
                  <p className="mt-2 text-sm text-text-muted">{tenant.notes}</p>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={startEditing} className="p-2 text-text-muted hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => { if (confirm('Delete this tenant? This cannot be undone.')) deleteMutation.mutate(); }} className="p-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {deleteMutation.isError && <p className="text-sm text-danger-600">{(deleteMutation.error as any)?.message || 'Cannot delete tenant with active contracts'}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active Contracts</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{activeContracts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">On-time Rate</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{onTimeRate !== null ? `${onTimeRate}%` : '--'}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-surface-border">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Current Lease Info */}
          {activeContracts.length > 0 ? (
            <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Current Lease</h3>
              <div className="space-y-4">
                {activeContracts.map(c => {
                  const remaining = daysUntil(c.end_date);
                  const contractPayments = c.payments || [];
                  const contractPaid = contractPayments.filter(p => p.status === 'paid').length;
                  return (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Link to={`/contracts/${c.id}`} className="font-medium text-accent-600 hover:underline">
                          {c.property_name} - {c.unit_number}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(c.start_date)} - {formatDate(c.end_date)}
                          </span>
                          <span>Rent: <span className="font-medium text-text-primary">{formatCurrency(c.rent_amount)}</span> / {frequencyLabel(c.payment_frequency).toLowerCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${remaining > 30 ? 'bg-emerald-50 text-emerald-700' : remaining > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {remaining > 0 ? `${remaining} days left` : 'Expired'}
                        </span>
                        <span className="text-text-muted">{contractPaid}/{c.total_payments} paid</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm text-center">
              <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted">No active lease.</p>
              <Link to="/contracts" className="inline-block mt-2 text-sm font-medium text-accent-600 hover:text-accent-700">Create a contract</Link>
            </div>
          )}

          {/* Tenant Insights */}
          <TenantInsights tenantId={Number(id)} />

          {/* Quick Payment Stats */}
          {allPayments.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Total Payments</p>
                  <p className="text-lg font-semibold text-text-primary">{allPayments.length}</p>
                </div>
                <div>
                  <p className="text-text-muted">Paid</p>
                  <p className="text-lg font-semibold text-emerald-600">{paidPayments.length}</p>
                </div>
                <div>
                  <p className="text-text-muted">Pending</p>
                  <p className="text-lg font-semibold text-amber-600">{pendingPayments.length}</p>
                </div>
                <div>
                  <p className="text-text-muted">Overdue</p>
                  <p className="text-lg font-semibold text-red-600">{overduePayments.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="animate-fade-in">
          {allPayments.length > 0 ? (
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface border-b border-surface-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Date</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Property / Unit</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Amount</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Method</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {allPayments.map((p, i) => (
                      <tr key={p.id} className="hover:bg-surface transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                        <td className="px-4 py-3 text-text-muted whitespace-nowrap">{formatDate(p.due_date)}</td>
                        <td className="px-4 py-3">
                          <Link to={`/contracts/${p.contract_id}`} className="text-accent-600 hover:underline">
                            {p.property_name} - {p.unit_number}
                          </Link>
                          <span className="ml-1 text-text-muted text-xs">#{p.payment_number}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-text-muted capitalize">{p.payment_method?.replace('_', ' ') || '--'}</td>
                        <td className="px-4 py-3 text-text-muted">{p.reference || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted">No payment records found.</p>
              <p className="text-sm text-text-muted mt-1">Payment data is populated from contract payment schedules.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Contract History ({contracts.length})</h3>
            <Link to="/contracts" className="flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700">
              <FileText className="w-3.5 h-3.5" /> New Contract
            </Link>
          </div>

          {contracts.length > 0 ? (
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface border-b border-surface-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Property / Unit</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Period</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Rent</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Frequency</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Payments</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {contracts.map((c, i) => {
                      const contractPayments = c.payments || [];
                      const paidCount = contractPayments.filter(p => p.status === 'paid').length;
                      const overdueCount = contractPayments.filter(p => p.status === 'overdue').length;
                      return (
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
                            <span className="text-text-muted">{paidCount}/{c.total_payments} paid</span>
                            {overdueCount > 0 && <span className="ml-1 text-xs text-red-600">({overdueCount} overdue)</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>{c.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted">No contracts for this tenant.</p>
              <Link to="/contracts" className="inline-block mt-3 text-sm font-medium text-accent-600 hover:text-accent-700">Create a contract</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (() => {
        const uniqueProperties = contracts.reduce<{ id: number; name: string }[]>((acc, c) => {
          if (c.property_id && !acc.find(p => p.id === c.property_id)) {
            acc.push({ id: c.property_id!, name: c.property_name || 'Unknown Property' });
          }
          return acc;
        }, []);

        return (
          <div className="space-y-6 animate-fade-in">
            {/* A) Personal Documents */}
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-accent-600" />
                <h3 className="font-semibold text-sm text-text-primary">Personal Documents</h3>
              </div>
              <DocumentUploader
                entityType="tenant"
                entityId={Number(id)}
                allowedTypes={['emirates_id', 'passport', 'visa', 'trade_license', 'other']}
              />
              <div className="mt-4">
                <DocumentGrid entityType="tenant" entityId={Number(id)} />
              </div>
            </div>

            {/* B) Ejari / Contract Documents */}
            {contracts.length > 0 && (
              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Stamp className="w-4 h-4 text-teal-600" />
                  <h3 className="font-semibold text-sm text-text-primary">Ejari / Contract Documents</h3>
                </div>
                <div className="space-y-5">
                  {contracts.map(c => (
                    <div key={c.id} className="border border-surface-border rounded-lg p-4">
                      <p className="text-sm font-medium text-text-primary mb-3">
                        {c.property_name} - {c.unit_number}
                      </p>
                      <DocumentUploader
                        entityType="contract"
                        entityId={c.id}
                        allowedTypes={['ejari', 'tawtheeq']}
                      />
                      <div className="mt-3">
                        <DocumentGrid entityType="contract" entityId={c.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C) Mortgage & Property Documents */}
            {uniqueProperties.length > 0 && (
              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="w-4 h-4 text-rose-600" />
                  <h3 className="font-semibold text-sm text-text-primary">Mortgage & Property Documents</h3>
                </div>
                <div className="space-y-5">
                  {uniqueProperties.map(prop => (
                    <div key={prop.id} className="border border-surface-border rounded-lg p-4">
                      <p className="text-sm font-medium text-text-primary mb-3">
                        {prop.name}
                      </p>
                      <DocumentUploader
                        entityType="property"
                        entityId={prop.id}
                        allowedTypes={['mortgage_contract', 'payment_schedule', 'insurance']}
                      />
                      <div className="mt-3">
                        <DocumentGrid entityType="property" entityId={prop.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
