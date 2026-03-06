import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Contract, Property, Tenant, Unit, ContractCreationAnalysis, UAE_EMIRATES } from '../types';
import { formatCurrency, formatDate, statusColor, frequencyLabel, daysUntil } from '../utils/formatters';
import { FileText, Plus, X, Paperclip, Upload, Sparkles, Check, Building2, User, Calendar, DollarSign } from 'lucide-react';

const defaultForm = {
  unit_id: '', tenant_id: '', start_date: '', end_date: '',
  rent_amount: '', payment_frequency: 'monthly', total_payments: '',
  deposit_amount: '', notes: '',
};

export default function Contracts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(defaultForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Upload state
  const [aiAnalysis, setAiAnalysis] = useState<ContractCreationAnalysis | null>(null);
  const [showAiReview, setShowAiReview] = useState(false);

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts', filter],
    queryFn: () => api.get(`/contracts${filter ? `?status=${filter}` : ''}`),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
    enabled: showForm,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants'),
    enabled: showForm,
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const { data: selectedProperty } = useQuery<Property>({
    queryKey: ['property', selectedPropertyId],
    queryFn: () => api.get(`/properties/${selectedPropertyId}`),
    enabled: !!selectedPropertyId,
  });

  const vacantUnits = selectedProperty?.units?.filter(u => u.status === 'vacant') || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/contracts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowForm(false);
      setForm(defaultForm);
      setSelectedPropertyId(null);
    },
  });

  // AI Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<ContractCreationAnalysis>('/ai/analyze-for-creation', formData);
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      setShowAiReview(true);
    },
  });

  // Auto-create from AI analysis
  const autoCreateMutation = useMutation({
    mutationFn: (data: any) => api.post('/contracts/create-from-analysis', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowAiReview(false);
      setAiAnalysis(null);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...form,
      unit_id: Number(form.unit_id),
      tenant_id: Number(form.tenant_id),
      rent_amount: Number(form.rent_amount),
      total_payments: Number(form.total_payments),
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
    });
  };

  const handleAutoCreate = () => {
    if (!aiAnalysis) return;
    autoCreateMutation.mutate(aiAnalysis);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">All Contracts</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="renewed">Renewed</option>
            <option value="draft">Draft</option>
          </select>
          <span className="text-sm text-gray-500">{contracts.length} contracts</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 border border-accent-200 text-accent-600 px-5 py-2.5 rounded-lg hover:bg-accent-50 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploadMutation.isPending ? 'Analyzing...' : 'Upload Contract'}
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm hover:shadow text-sm transition-all duration-200 btn-press">
            <Plus className="w-4 h-4" /> New Contract
          </button>
        </div>
      </div>

      {/* AI Upload Loading */}
      {uploadMutation.isPending && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm modal-content">
          <div className="flex flex-col items-center justify-center">
            <div className="relative animate-float">
              <div className="w-16 h-16 rounded-xl bg-accent-50 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-accent-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-600 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">AI is analyzing your contract...</p>
            <p className="text-xs text-gray-400 mt-1">Extracting tenant, property, and payment details</p>
          </div>
        </div>
      )}

      {/* AI Upload Error */}
      {uploadMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{(uploadMutation.error as Error).message}</p>
        </div>
      )}

      {/* AI Review Card */}
      {showAiReview && aiAnalysis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-slide-up space-y-5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Contract Analysis</h3>
                <p className="text-sm text-gray-500">{aiAnalysis.summary}</p>
              </div>
            </div>
            <button onClick={() => { setShowAiReview(false); setAiAnalysis(null); }} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Extracted Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tenant */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-accent-600" />
                <h4 className="text-sm font-semibold text-gray-900">Tenant</h4>
                <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium">New</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Name</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.tenant.first_name + ' ' + aiAnalysis.tenant.last_name} onChange={e => {
                    const parts = e.target.value.split(' ');
                    setAiAnalysis({ ...aiAnalysis, tenant: { ...aiAnalysis.tenant, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' } });
                  }} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Phone</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.tenant.phone} onChange={e => setAiAnalysis({ ...aiAnalysis, tenant: { ...aiAnalysis.tenant, phone: e.target.value } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.tenant.email || ''} onChange={e => setAiAnalysis({ ...aiAnalysis, tenant: { ...aiAnalysis.tenant, email: e.target.value || null } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">ID Number</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.tenant.id_number || ''} onChange={e => setAiAnalysis({ ...aiAnalysis, tenant: { ...aiAnalysis.tenant, id_number: e.target.value || null } })} />
                </div>
              </div>
            </div>

            {/* Property */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-accent-600" />
                <h4 className="text-sm font-semibold text-gray-900">Property</h4>
                <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium">New</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Name</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.property.name} onChange={e => setAiAnalysis({ ...aiAnalysis, property: { ...aiAnalysis.property, name: e.target.value } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Emirate</p>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.property.emirate} onChange={e => setAiAnalysis({ ...aiAnalysis, property: { ...aiAnalysis.property, emirate: e.target.value } })}>
                    {UAE_EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">City / Area</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.property.city || ''} onChange={e => setAiAnalysis({ ...aiAnalysis, property: { ...aiAnalysis.property, city: e.target.value || null } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Unit #</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.unit.unit_number} onChange={e => setAiAnalysis({ ...aiAnalysis, unit: { ...aiAnalysis.unit, unit_number: e.target.value } })} />
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="bg-white rounded-xl p-4 space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-accent-600" />
                <h4 className="text-sm font-semibold text-gray-900">Contract Details</h4>
              </div>
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Start Date</p>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.start_date} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, start_date: e.target.value } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">End Date</p>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.end_date} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, end_date: e.target.value } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Rent Amount (per period)</p>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.rent_amount} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, rent_amount: Number(e.target.value) } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Payment Frequency</p>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.payment_frequency} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, payment_frequency: e.target.value } })}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi_annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Payments / Cheques</p>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.total_payments} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, total_payments: Number(e.target.value) } })} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Security Deposit</p>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.deposit_amount || ''} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, deposit_amount: e.target.value ? Number(e.target.value) : null } })} placeholder="Optional" />
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-xs">Notes</p>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={aiAnalysis.contract.notes || ''} onChange={e => setAiAnalysis({ ...aiAnalysis, contract: { ...aiAnalysis.contract, notes: e.target.value || null } })} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          {aiAnalysis.contract.rent_amount && aiAnalysis.contract.total_payments && (
            <div className="p-4 bg-accent-50 rounded-xl border border-accent-100">
              <p className="text-sm font-medium text-accent-700">
                {aiAnalysis.contract.total_payments} payments of {formatCurrency(aiAnalysis.contract.rent_amount)} ({frequencyLabel(aiAnalysis.contract.payment_frequency)})
              </p>
              <p className="text-sm text-accent-600">
                Total: {formatCurrency(aiAnalysis.contract.rent_amount * aiAnalysis.contract.total_payments)}
                {aiAnalysis.contract.deposit_amount ? ` + ${formatCurrency(aiAnalysis.contract.deposit_amount)} deposit` : ''}
              </p>
            </div>
          )}

          {autoCreateMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{(autoCreateMutation.error as Error).message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAutoCreate}
              disabled={!aiAnalysis.contract.start_date || !aiAnalysis.contract.end_date || !aiAnalysis.contract.rent_amount || !aiAnalysis.contract.total_payments || !aiAnalysis.tenant.first_name || !aiAnalysis.tenant.phone || autoCreateMutation.isPending}
              className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              {autoCreateMutation.isPending ? 'Creating...' : 'Create All & Generate Schedule'}
            </button>
            <button
              onClick={() => { setShowAiReview(false); setAiAnalysis(null); }}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Contract Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm modal-content">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900">New Contract</h3>
            <button onClick={() => { setShowForm(false); setSelectedPropertyId(null); }} className="text-gray-400 hover:text-gray-500"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Property *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none"
                value={selectedPropertyId ?? ''}
                onChange={e => { setSelectedPropertyId(Number(e.target.value)); setForm({ ...form, unit_id: '' }); }}
              >
                <option value="">Select property...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name} - {p.emirate}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Unit (Vacant) *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none"
                value={form.unit_id}
                onChange={e => setForm({ ...form, unit_id: e.target.value })}
                disabled={!selectedPropertyId}
              >
                <option value="">Select unit...</option>
                {vacantUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number} {u.floor ? `(Floor ${u.floor})` : ''}</option>)}
              </select>
              {selectedPropertyId && vacantUnits.length === 0 && (
                <p className="text-xs text-red-600 mt-1">No vacant units in this property</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tenant *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                <option value="">Select tenant...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Payment Frequency *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.payment_frequency} onChange={e => setForm({ ...form, payment_frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Start Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">End Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Rent Amount (per period) *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} placeholder="5000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Number of Payments/Checks *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.total_payments} onChange={e => setForm({ ...form, total_payments: e.target.value })} placeholder="12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Security Deposit Amount</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.deposit_amount} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          {/* Schedule Preview */}
          {form.rent_amount && form.total_payments && form.start_date && (
            <div className="mt-4 p-4 bg-accent-50 rounded-lg border border-accent-100">
              <p className="text-sm font-medium text-accent-700">Payment Schedule Preview</p>
              <p className="text-sm text-accent-600 mt-1">
                {form.total_payments} payments of {formatCurrency(Number(form.rent_amount))} ({frequencyLabel(form.payment_frequency)})
              </p>
              <p className="text-sm text-accent-600">
                Total contract value: {formatCurrency(Number(form.rent_amount) * Number(form.total_payments))}
              </p>
              {form.deposit_amount && (
                <p className="text-sm text-accent-600">Security deposit: {formatCurrency(Number(form.deposit_amount))}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.unit_id || !form.tenant_id || !form.start_date || !form.end_date || !form.rent_amount || !form.total_payments}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors active:scale-95 text-sm"
            >
              Create Contract & Generate Schedule
            </button>
            <button onClick={() => { setShowForm(false); setSelectedPropertyId(null); }} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Contract List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-1/5" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-1/5" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No contracts found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Tenant</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Property / Unit</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Period</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Rent</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Payments</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Docs</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((c, i) => {
                const days = daysUntil(c.end_date);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                    <td className="px-4 py-3">
                      <Link to={`/contracts/${c.id}`} className="font-medium text-accent-600 hover:underline">{c.tenant_name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.property_name} - {c.unit_number}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.start_date)} - {formatDate(c.end_date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(c.rent_amount)}/{frequencyLabel(c.payment_frequency).toLowerCase()}</td>
                    <td className="px-4 py-3 text-gray-500">{c.total_payments} checks</td>
                    <td className="px-4 py-3">
                      {(c.file_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-accent-600">
                          <Paperclip className="w-3 h-3" /> {c.file_count}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'active' && (
                        <span className={`text-xs font-medium ${days <= 30 ? 'text-red-600' : days <= 60 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {days > 0 ? `${days} days` : 'Expired'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
