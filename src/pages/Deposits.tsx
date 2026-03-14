import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Deposit } from '../types';
import { formatCurrency, formatDate, statusColor } from '../utils/formatters';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Deposits() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ['deposits', statusFilter],
    queryFn: () => api.get(`/deposits${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const refundMutation = useMutation({
    mutationFn: (data: { depositId: number; refund_amount: number; refund_reason: string }) =>
      api.post(`/deposits/${data.depositId}/refund`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success('Deposit refunded');
    },
    onError: () => {
      toast.error('Failed to refund deposit');
    },
  });

  const totalHeld = deposits.filter(d => d.status === 'held').reduce((s, d) => s + d.amount, 0);
  const totalRefunded = deposits.filter(d => d.refund_amount).reduce((s, d) => s + (d.refund_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Deposits</option>
            <option value="held">Held</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="forfeited">Forfeited</option>
          </select>
          <span className="text-sm text-text-muted">{deposits.length} deposits</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-1">
          <p className="text-sm text-text-muted">Total Deposits</p>
          <p className="text-xl font-semibold text-text-primary mt-1">{deposits.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-2">
          <p className="text-sm text-text-muted">Currently Held</p>
          <p className="text-xl font-semibold text-accent-600 mt-1">{formatCurrency(totalHeld)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-3">
          <p className="text-sm text-text-muted">Total Refunded</p>
          <p className="text-xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalRefunded)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-1/5" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No deposits found.</p>
          <p className="text-sm text-text-muted mt-1">Security deposits are created alongside contracts.</p>
          <a href="/contracts" className="inline-block mt-3 text-sm font-medium text-accent-600 hover:text-accent-700">Create a contract with deposit →</a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Tenant</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Property / Unit</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Amount</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Received</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Refund</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-2.5">
                    <Link to={`/contracts/${d.contract_id}`} className="font-medium text-accent-600 hover:underline">{d.tenant_name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">{d.property_name} - {d.unit_number}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-2.5 text-text-muted">{formatDate(d.date_received)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(d.status)}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted text-xs">
                    {d.refund_amount ? `${formatCurrency(d.refund_amount)} on ${formatDate(d.refund_date!)}` : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {d.status === 'held' && (
                      <button
                        onClick={() => {
                          const amount = prompt('Refund amount:', String(d.amount));
                          if (amount) {
                            refundMutation.mutate({
                              depositId: d.id,
                              refund_amount: Number(amount),
                              refund_reason: 'Deposit returned to tenant',
                            });
                          }
                        }}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      >
                        Refund
                      </button>
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
