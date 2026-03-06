import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Mortgage, MortgagePayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import AmortizationChart from '../components/charts/AmortizationChart';
import { ArrowLeft, Landmark, CheckCircle2, Clock, DollarSign, Pencil, Trash2, Check, X } from 'lucide-react';

export default function MortgageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    lender_name: '', loan_amount: '', interest_rate: '', term_months: '',
    start_date: '', monthly_payment: '', loan_type: 'fixed', account_number: '', notes: '',
  });

  const { data: mortgage, isLoading } = useQuery<Mortgage & { payments: MortgagePayment[] }>({
    queryKey: ['mortgage', id],
    queryFn: () => api.get(`/mortgages/${id}`),
  });

  const markPaidMutation = useMutation({
    mutationFn: (payId: number) => api.post(`/mortgages/${id}/payments/${payId}/mark-paid`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mortgage', id] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/mortgages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgage', id] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/mortgages/${id}`),
    onSuccess: () => {
      if (mortgage) navigate(`/properties/${mortgage.property_id}`);
    },
  });

  const startEditing = () => {
    if (!mortgage) return;
    setEditForm({
      lender_name: mortgage.lender_name, loan_amount: String(mortgage.loan_amount),
      interest_rate: String(mortgage.interest_rate), term_months: String(mortgage.term_months),
      start_date: mortgage.start_date, monthly_payment: String(mortgage.monthly_payment),
      loan_type: mortgage.loan_type || 'fixed', account_number: mortgage.account_number || '',
      notes: mortgage.notes || '',
    });
    setEditing(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
  if (!mortgage) return <p className="text-danger-600">Mortgage not found</p>;

  const payments = mortgage.payments || [];
  const paidCount = payments.filter(p => p.status === 'paid').length;
  const totalPrincipalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.principal, 0);
  const totalInterestPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.interest, 0);
  const paidPercent = mortgage.loan_amount > 0
    ? ((mortgage.loan_amount - (mortgage.remaining_balance ?? mortgage.loan_amount)) / mortgage.loan_amount) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Link to={`/properties/${mortgage.property_id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Property
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-fade-in">
        {editing ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Mortgage</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lender *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.lender_name} onChange={e => setEditForm({ ...editForm, lender_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Loan Amount</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.loan_amount} onChange={e => setEditForm({ ...editForm, loan_amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Interest Rate (%)</label>
                <input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.interest_rate} onChange={e => setEditForm({ ...editForm, interest_rate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Term (months)</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.term_months} onChange={e => setEditForm({ ...editForm, term_months: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monthly Payment</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.monthly_payment} onChange={e => setEditForm({ ...editForm, monthly_payment: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Loan Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.loan_type} onChange={e => setEditForm({ ...editForm, loan_type: e.target.value })}>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.account_number} onChange={e => setEditForm({ ...editForm, account_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            {updateMutation.isError && <p className="mt-2 text-sm text-danger-600">Update failed</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => updateMutation.mutate({ ...editForm, loan_amount: Number(editForm.loan_amount), interest_rate: Number(editForm.interest_rate), term_months: Number(editForm.term_months), monthly_payment: Number(editForm.monthly_payment) })} disabled={!editForm.lender_name || updateMutation.isPending} className="flex items-center gap-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent-50 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{mortgage.lender_name}</h2>
                  <p className="text-sm text-gray-500">{mortgage.property_name} &middot; {mortgage.loan_type} rate at {mortgage.interest_rate}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={startEditing} className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Delete this mortgage and all its payments?')) deleteMutation.mutate(); }} className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Loan Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(mortgage.loan_amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Monthly Payment</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(mortgage.monthly_payment)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Remaining Balance</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(mortgage.remaining_balance ?? mortgage.loan_amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Term</p>
                <p className="text-lg font-bold text-gray-900">{mortgage.term_months} months ({Math.round(mortgage.term_months / 12)} yrs)</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{paidCount} of {payments.length} payments made</span>
                <span>{paidPercent.toFixed(1)}% paid off</span>
              </div>
              <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(paidPercent, 100)}%` }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-1">
          <p className="text-sm text-gray-500">Principal Paid</p>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalPrincipalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-2">
          <p className="text-sm text-gray-500">Interest Paid</p>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalInterestPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-3">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPrincipalPaid + totalInterestPaid)}</p>
        </div>
      </div>

      {/* Amortization Chart */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Amortization Schedule</h3>
          <AmortizationChart payments={payments} height={300} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Principal</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Interest</span>
          </div>
        </div>
      )}

      {/* Payment Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Payment Schedule</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Due Date</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Principal</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Interest</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Balance</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p, i) => (
                <tr key={p.id} className={`transition-colors animate-fade-in-fast ${p.status === 'paid' ? 'bg-success-50/30' : 'hover:bg-gray-50'}`} style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                  <td className="px-4 py-2.5 text-gray-500">{p.payment_number}</td>
                  <td className="px-4 py-2.5 text-gray-900">{formatDate(p.due_date)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrency(p.principal)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(p.interest)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(p.total_amount)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(p.remaining_balance)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      p.status === 'paid' ? 'bg-success-50 text-success-700' :
                      p.status === 'overdue' ? 'bg-danger-50 text-danger-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {p.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 'pending' && <Clock className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {p.status === 'pending' && (
                      <button
                        onClick={() => markPaidMutation.mutate(p.id)}
                        disabled={markPaidMutation.isPending}
                        className="flex items-center gap-1 text-xs text-success-600 hover:text-success-700 font-medium"
                      >
                        <DollarSign className="w-3 h-3" /> Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
