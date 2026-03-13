import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Payment } from '../types';
import { formatCurrency, formatDate, statusColor } from '../utils/formatters';
import { CreditCard, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function Payments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('check');
  const [payRef, setPayRef] = useState('');

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', statusFilter],
    queryFn: () => api.get(`/payments${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: any }) =>
      api.post(`/payments/${paymentId}/mark-paid`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setPayingId(null);
      setPayRef('');
    },
  });

  const summary = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    paid: payments.filter(p => p.status === 'paid').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <select className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-text-muted">{payments.length} payments</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-surface-border p-4 card-hover animate-fade-in animate-stagger-1">
          <p className="text-sm text-text-muted">Total Due</p>
          <p className="text-xl font-bold text-text-primary stat-value">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 card-hover animate-fade-in animate-stagger-2">
          <p className="text-sm text-text-muted">Collected</p>
          <p className="text-xl font-bold text-emerald-600 stat-value">{formatCurrency(summary.paidAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 card-hover animate-fade-in animate-stagger-3">
          <p className="text-sm text-text-muted">Pending</p>
          <p className="text-xl font-bold text-amber-600 stat-value">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 card-hover animate-fade-in animate-stagger-4">
          <p className="text-sm text-text-muted">Overdue</p>
          <p className="text-xl font-bold text-red-600 stat-value">{summary.overdue}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-1/5" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No payments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Tenant</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Property / Unit</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Due Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Amount</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Paid</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {payments.map((p, i) => (
                <tr key={p.id} className="hover:bg-surface transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <td className="px-4 py-3">
                    <Link to={`/contracts/${p.contract_id}`} className="font-medium text-accent-600 hover:underline">{p.tenant_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{p.property_name} - {p.unit_number}</td>
                  <td className="px-4 py-3 text-text-primary">{formatDate(p.due_date)}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>
                      {p.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                      {p.status === 'pending' && <Clock className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {p.paid_date ? `${formatDate(p.paid_date)} (${p.payment_method || ''})` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {(p.status === 'pending' || p.status === 'overdue') && (
                      <>
                        {payingId === p.id ? (
                          <div className="flex items-center gap-2">
                            <select className="border border-surface-border rounded-lg px-3 py-2 text-xs bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                              <option value="check">Check</option>
                              <option value="bank_transfer">Transfer</option>
                              <option value="cash">Cash</option>
                              <option value="other">Other</option>
                            </select>
                            <input className="border border-surface-border rounded-lg px-3 py-2 text-xs w-20 bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20" placeholder="Ref #" value={payRef} onChange={e => setPayRef(e.target.value)} />
                            <button onClick={() => markPaidMutation.mutate({ paymentId: p.id, data: { payment_method: payMethod, reference: payRef } })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs transition-colors">OK</button>
                            <button onClick={() => setPayingId(null)} className="text-text-muted text-xs">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setPayingId(p.id)} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                            Mark Paid
                          </button>
                        )}
                      </>
                    )}
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
