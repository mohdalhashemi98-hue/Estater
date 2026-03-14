import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { X } from 'lucide-react';

interface ValuationFormProps {
  propertyId: number;
  onClose: () => void;
}

export default function ValuationForm({ propertyId, onClose }: ValuationFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    valuation_date: new Date().toISOString().split('T')[0],
    estimated_value: '',
    source: 'manual',
    confidence: 'high',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/properties/${propertyId}/valuations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', String(propertyId)] });
      queryClient.invalidateQueries({ queryKey: ['property', String(propertyId)] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      onClose();
    },
  });

  const inputClass = "w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none";

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-text-primary">Add Valuation</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Date *</label>
          <input type="date" className={inputClass} value={form.valuation_date} onChange={e => setForm({ ...form, valuation_date: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Estimated Value *</label>
          <input type="number" className={inputClass} value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} placeholder="450000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Source</label>
          <select className={inputClass} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            <option value="manual">Manual Entry</option>
            <option value="zillow">Zillow</option>
            <option value="redfin">Redfin</option>
            <option value="realtor">Realtor.com</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Confidence</label>
          <select className={inputClass} value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
          <input className={inputClass} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-3 text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => mutation.mutate({
            ...form,
            estimated_value: Number(form.estimated_value),
          })}
          disabled={!form.estimated_value || !form.valuation_date || mutation.isPending}
          className="bg-accent-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Saving...' : 'Add Valuation'}
        </button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-surface transition-colors">Cancel</button>
      </div>
    </div>
  );
}
