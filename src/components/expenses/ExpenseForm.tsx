import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Expense, Property, EXPENSE_CATEGORIES } from '../../types';
import { categoryLabel } from '../../utils/formatters';
import CurrencySelector from '../ui/CurrencySelector';

interface Props {
  expense: Expense | null;
  properties: Property[];
  onSuccess: () => void;
}

export default function ExpenseForm({ expense, properties, onSuccess }: Props) {
  const [form, setForm] = useState<{
    property_id: string; unit_id: string; category: string;
    amount: string; expense_date: string; vendor_name: string;
    description: string; recurring: boolean; recurring_frequency: string; currency: string;
  }>({
    property_id: expense?.property_id?.toString() || '',
    unit_id: expense?.unit_id?.toString() || '',
    category: expense?.category || 'maintenance',
    amount: expense?.amount?.toString() || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    vendor_name: expense?.vendor_name || '',
    description: expense?.description || '',
    recurring: expense?.recurring ? true : false,
    recurring_frequency: expense?.recurring_frequency || 'monthly',
    currency: expense?.currency || 'AED',
  });
  const [receipt, setReceipt] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (expense) {
        return api.put(`/expenses/${expense.id}`, { ...form, amount: Number(form.amount), property_id: Number(form.property_id), unit_id: form.unit_id ? Number(form.unit_id) : null });
      }
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (receipt) fd.append('receipt', receipt);
      return api.upload('/expenses', fd);
    },
    onSuccess,
  });

  const selectedProp = properties.find(p => p.id === Number(form.property_id));

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Property *</label>
          <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value, unit_id: '' }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
            <option value="">Select property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Unit (optional)</label>
          <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">None</option>
            {selectedProp?.units?.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
          <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Amount *</label>
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
          <CurrencySelector value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Name</label>
        <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} />
      </div>

      {!expense && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Receipt</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setReceipt(e.target.files?.[0] || null)}
            className="w-full text-sm" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} id="recurring" />
        <label htmlFor="recurring" className="text-sm text-gray-600">Recurring expense</label>
        {form.recurring && (
          <select value={form.recurring_frequency} onChange={e => setForm(f => ({ ...f, recurring_frequency: e.target.value }))}
            className="ml-2 text-sm border border-gray-200 rounded-lg px-2 py-1">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        )}
      </div>

      <button type="submit" disabled={mutation.isPending}
        className="w-full py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50">
        {mutation.isPending ? 'Saving...' : (expense ? 'Update Expense' : 'Add Expense')}
      </button>
    </form>
  );
}
