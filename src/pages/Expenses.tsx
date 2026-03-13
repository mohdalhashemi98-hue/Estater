import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Expense, ExpenseSummary, Property, EXPENSE_CATEGORIES } from '../types';
import { formatCurrency, formatDate, categoryLabel } from '../utils/formatters';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseSummaryCharts from '../components/expenses/ExpenseSummaryCharts';
import { Receipt, Plus, Trash2, Pencil, X } from 'lucide-react';

export default function Expenses() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({ property_id: '', category: '', from_date: '', to_date: '' });

  const queryStr = Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&');

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses', queryStr],
    queryFn: () => api.get(`/expenses?${queryStr}`),
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ['expense-summary', queryStr],
    queryFn: () => api.get(`/expenses/summary?${queryStr}`),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.del(`/expenses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['expense-summary'] }); },
  });

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Expenses</h1>
          <p className="text-sm text-text-muted mt-0.5">Track and manage property expenses</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="pill-btn bg-accent-600 text-white hover:bg-accent-700 shadow-sm btn-press">
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-1">
        <select value={filters.property_id} onChange={e => setFilters(f => ({ ...f, property_id: e.target.value }))}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white">
          <option value="">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white">
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5" placeholder="From" />
        <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5" placeholder="To" />
        {(filters.property_id || filters.category || filters.from_date || filters.to_date) && (
          <button onClick={() => setFilters({ property_id: '', category: '', from_date: '', to_date: '' })}
            className="text-xs text-text-muted hover:text-text-secondary">Clear</button>
        )}
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Expenses', value: formatCurrency(summary.total_amount) },
            { label: 'Number of Expenses', value: summary.total_count },
            { label: 'Categories', value: summary.by_category.length },
            { label: 'Properties', value: summary.by_property.length },
          ].map((stat, i) => (
            <div key={stat.label} className={`bg-white rounded-xl border border-surface-border p-4 card-hover animate-fade-in animate-stagger-${i + 2}`}>
              <p className="text-xs text-text-muted font-medium">{stat.label}</p>
              <p className="text-xl font-semibold text-text-primary mt-1 stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {summary && summary.total_count > 0 && <ExpenseSummaryCharts summary={summary} />}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20 modal-backdrop">
          <div className="bg-white rounded-xl border border-surface-border shadow-xl w-full max-w-lg p-6 modal-content">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <ExpenseForm
              expense={editing}
              properties={properties}
              onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['expense-summary'] }); }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden animate-fade-in animate-stagger-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Property</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Vendor</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Receipt</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-surface row-hover table-row-enter">
                  <td className="px-4 py-3 text-text-secondary">{formatDate(exp.expense_date)}</td>
                  <td className="px-4 py-3 text-text-secondary">{exp.property_name}{exp.unit_number ? ` — ${exp.unit_number}` : ''}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-overlay text-text-secondary">{categoryLabel(exp.category)}</span></td>
                  <td className="px-4 py-3 text-text-muted">{exp.vendor_name || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary tabular-nums">{formatCurrency(exp.amount, exp.currency)}</td>
                  <td className="px-4 py-3 text-center">
                    {exp.receipt_file ? (
                      <a href={`/api/expenses/${exp.id}/receipt`} target="_blank" rel="noreferrer" className="text-accent-600 hover:text-accent-700">
                        <Receipt className="w-4 h-4 inline" />
                      </a>
                    ) : <span className="text-text-muted">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(exp); setShowForm(true); }} className="p-1 text-text-muted hover:text-text-secondary"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete this expense?')) deleteMut.mutate(exp.id); }} className="p-1 text-text-muted hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No expenses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
