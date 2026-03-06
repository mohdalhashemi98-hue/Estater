import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { X, Upload, Sparkles } from 'lucide-react';

interface MortgageFormProps {
  propertyId: number;
  onClose: () => void;
}

interface MortgageAnalysis {
  lender_name: string;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number | null;
  loan_type: 'fixed' | 'variable' | 'interest_only';
  account_number: string | null;
  start_date: string | null;
  notes: string;
}

export default function MortgageForm({ propertyId, onClose }: MortgageFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    lender_name: '',
    loan_amount: '',
    interest_rate: '',
    term_months: '360',
    start_date: '',
    monthly_payment: '',
    loan_type: 'fixed',
    account_number: '',
    notes: '',
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<MortgageAnalysis>('/ai/analyze-mortgage', formData);
    },
    onSuccess: (data) => {
      const filled = new Set<string>();
      const updates: any = {};

      if (data.lender_name) { updates.lender_name = data.lender_name; filled.add('lender_name'); }
      if (data.loan_amount) { updates.loan_amount = String(data.loan_amount); filled.add('loan_amount'); }
      if (data.interest_rate) { updates.interest_rate = String(data.interest_rate); filled.add('interest_rate'); }
      if (data.term_months) { updates.term_months = String(data.term_months); filled.add('term_months'); }
      if (data.monthly_payment) { updates.monthly_payment = String(data.monthly_payment); filled.add('monthly_payment'); }
      if (data.loan_type) { updates.loan_type = data.loan_type; filled.add('loan_type'); }
      if (data.account_number) { updates.account_number = data.account_number; filled.add('account_number'); }
      if (data.start_date) { updates.start_date = data.start_date; filled.add('start_date'); }
      if (data.notes) { updates.notes = data.notes; filled.add('notes'); }

      setForm(prev => ({ ...prev, ...updates }));
      setAiFields(filled);
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/properties/${propertyId}/mortgages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', String(propertyId)] });
      queryClient.invalidateQueries({ queryKey: ['mortgages'] });
      onClose();
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    mutation.mutate({
      lender_name: form.lender_name,
      loan_amount: Number(form.loan_amount),
      interest_rate: Number(form.interest_rate),
      term_months: Number(form.term_months),
      start_date: form.start_date,
      monthly_payment: form.monthly_payment ? Number(form.monthly_payment) : undefined,
      loan_type: form.loan_type,
      account_number: form.account_number || undefined,
      notes: form.notes || undefined,
    });
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none";

  const AiBadge = ({ field }: { field: string }) =>
    aiFields.has(field) ? (
      <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700">AI</span>
    ) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-gray-900">Add Mortgage</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Button */}
      <div className="mb-4">
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 border border-accent-200 text-accent-600 px-3 py-2 rounded-lg hover:bg-accent-50 font-medium text-xs transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploadMutation.isPending ? 'Analyzing...' : 'Upload Bank Contract'}
        </button>
      </div>

      {/* AI Analyzing State */}
      {uploadMutation.isPending && (
        <div className="mb-4 p-5 bg-gray-50 rounded-lg border border-gray-200 animate-scale-in">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-accent-50 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-accent-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-ping" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">AI is analyzing your mortgage document...</p>
            <p className="text-xs text-gray-400 mt-1">Extracting lender, rates, terms, and payment details</p>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {(uploadMutation.error as Error).message}
        </div>
      )}

      {uploadMutation.isSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Mortgage details extracted successfully. Review and submit below.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Lender Name *<AiBadge field="lender_name" /></label>
          <input className={inputClass} value={form.lender_name} onChange={e => setForm({ ...form, lender_name: e.target.value })} placeholder="e.g., Emirates NBD" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Loan Amount *<AiBadge field="loan_amount" /></label>
          <input type="number" className={inputClass} value={form.loan_amount} onChange={e => setForm({ ...form, loan_amount: e.target.value })} placeholder="300000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Interest Rate (%) *<AiBadge field="interest_rate" /></label>
          <input type="number" step="0.01" className={inputClass} value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} placeholder="3.99" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Term (months) *<AiBadge field="term_months" /></label>
          <input type="number" className={inputClass} value={form.term_months} onChange={e => setForm({ ...form, term_months: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date *<AiBadge field="start_date" /></label>
          <input type="date" className={inputClass} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Payment<AiBadge field="monthly_payment" /></label>
          <input type="number" className={inputClass} value={form.monthly_payment} onChange={e => setForm({ ...form, monthly_payment: e.target.value })} placeholder="Auto-calculated" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Loan Type<AiBadge field="loan_type" /></label>
          <select className={inputClass} value={form.loan_type} onChange={e => setForm({ ...form, loan_type: e.target.value })}>
            <option value="fixed">Fixed Rate</option>
            <option value="variable">Variable Rate</option>
            <option value="interest_only">Interest Only</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Account Number<AiBadge field="account_number" /></label>
          <input className={inputClass} value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes<AiBadge field="notes" /></label>
        <textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>

      {mutation.isError && (
        <p className="mt-3 text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!form.lender_name || !form.loan_amount || !form.interest_rate || !form.start_date || mutation.isPending}
          className="bg-accent-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Creating...' : 'Add Mortgage'}
        </button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </div>
  );
}
