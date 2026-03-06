import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Contract, Payment, ContractFile } from '../types';
import { formatCurrency, formatDate, statusColor, frequencyLabel, daysUntil, formatFileSize, fileIcon } from '../utils/formatters';
import {
  ArrowLeft, Calendar, DollarSign, User, Building2, Shield,
  CheckCircle2, AlertTriangle, RefreshCw, XCircle, Clock,
  Upload, FileText, FileImage, FileSpreadsheet, File, Download, Trash2, Paperclip,
  Pencil, Check, X
} from 'lucide-react';
import ContractAnalysis from '../components/ai/ContractAnalysis';
import SyncButton from '../components/calendar/SyncButton';

export default function ContractDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('check');
  const [payRef, setPayRef] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({
    start_date: '', end_date: '', rent_amount: '', payment_frequency: 'monthly',
    total_payments: '', deposit_amount: '',
  });
  const [editingContract, setEditingContract] = useState(false);
  const [contractForm, setContractForm] = useState({ start_date: '', end_date: '', rent_amount: '', payment_frequency: 'monthly', total_payments: '', notes: '', status: 'active' });
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', notes: '' });

  const { data: contract, isLoading } = useQuery<Contract>({
    queryKey: ['contract', id],
    queryFn: () => api.get(`/contracts/${id}`),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: any }) =>
      api.post(`/payments/${paymentId}/mark-paid`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setPayingId(null);
      setPayRef('');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: () => api.post(`/contracts/${id}/terminate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data: any) => api.post(`/contracts/${id}/renew`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowRenew(false);
    },
  });

  const refundMutation = useMutation({
    mutationFn: (data: { depositId: number; refund_amount: number; refund_reason: string }) =>
      api.post(`/deposits/${data.depositId}/refund`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contract', id] }),
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      return api.upload<ContractFile[]>(`/contracts/${id}/files`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => setUploading(false),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => api.del(`/contracts/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contract', id] }),
  });

  const updateContractMutation = useMutation({
    mutationFn: (data: any) => api.put(`/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setEditingContract(false);
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: (data: any) => api.put(`/deposits/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setEditingDeposit(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      uploadFilesMutation.mutate(e.target.files);
    }
  };

  const getFileIcon = (mimeType: string) => {
    const type = fileIcon(mimeType);
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-danger-600" />;
      case 'image': return <FileImage className="w-5 h-5 text-accent-600" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-success-600" />;
      case 'word': return <FileText className="w-5 h-5 text-accent-600" />;
      default: return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
  if (!contract) return <p className="text-danger-600">Contract not found</p>;

  const days = daysUntil(contract.end_date);
  const payments = contract.payments || [];
  const paidCount = payments.filter(p => p.status === 'paid').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <Link to="/contracts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Contracts
      </Link>

      {/* Expiry Warning */}
      {contract.status === 'active' && days <= 60 && days > 0 && (
        <div className="bg-warning-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <span className="text-sm font-medium text-warning-700">
              This contract expires in {days} days ({formatDate(contract.end_date)})
            </span>
          </div>
          <button
            onClick={() => {
              setRenewForm({
                start_date: contract.end_date, end_date: '',
                rent_amount: String(contract.rent_amount),
                payment_frequency: contract.payment_frequency,
                total_payments: String(contract.total_payments), deposit_amount: '',
              });
              setShowRenew(true);
            }}
            className="bg-warning-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Renew Contract
          </button>
        </div>
      )}

      {/* Contract Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-fade-in">
        {editingContract ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Contract #{contract.id}</h2>
              <button onClick={() => setEditingContract(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.start_date} onChange={e => setContractForm({ ...contractForm, start_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.end_date} onChange={e => setContractForm({ ...contractForm, end_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Rent Amount</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.rent_amount} onChange={e => setContractForm({ ...contractForm, rent_amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Frequency</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.payment_frequency} onChange={e => setContractForm({ ...contractForm, payment_frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi_annual">Semi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Total Payments</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.total_payments} onChange={e => setContractForm({ ...contractForm, total_payments: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.status} onChange={e => setContractForm({ ...contractForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="terminated">Terminated</option>
                  <option value="renewed">Renewed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} />
              </div>
            </div>
            {updateContractMutation.isError && <p className="mt-2 text-sm text-danger-600">{(updateContractMutation.error as any)?.message || 'Update failed'}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => updateContractMutation.mutate({ ...contractForm, rent_amount: Number(contractForm.rent_amount), total_payments: Number(contractForm.total_payments) })} disabled={updateContractMutation.isPending} className="flex items-center gap-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setEditingContract(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">Contract #{contract.id}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(contract.status)}`}>{contract.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Tenant</p>
                      <p className="font-medium text-gray-900">{contract.tenant_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Property</p>
                      <p className="font-medium text-gray-900">{contract.property_name} - {contract.unit_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Period</p>
                      <p className="font-medium text-gray-900">{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Rent</p>
                      <p className="font-medium text-gray-900">{formatCurrency(contract.rent_amount)} / {frequencyLabel(contract.payment_frequency).toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setContractForm({
                      start_date: contract.start_date, end_date: contract.end_date,
                      rent_amount: String(contract.rent_amount), payment_frequency: contract.payment_frequency,
                      total_payments: String(contract.total_payments), notes: contract.notes || '', status: contract.status,
                    });
                    setEditingContract(true);
                  }}
                  className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {contract.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        setRenewForm({
                          start_date: contract.end_date, end_date: '',
                          rent_amount: String(contract.rent_amount),
                          payment_frequency: contract.payment_frequency,
                          total_payments: String(contract.total_payments), deposit_amount: '',
                        });
                        setShowRenew(true);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-accent-200 text-accent-600 hover:bg-accent-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Renew
                    </button>
                    <button
                      onClick={() => { if (confirm('Terminate this contract? Pending payments will be cancelled.')) terminateMutation.mutate(); }}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-danger-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Terminate
                    </button>
                    <SyncButton contractId={contract.id} />
                  </>
                )}
              </div>
            </div>

            {contract.notes && <p className="mt-4 text-sm text-gray-500">{contract.notes}</p>}
            {contract.renewal_of && (
              <p className="mt-2 text-sm text-accent-600">
                Renewed from <Link to={`/contracts/${contract.renewal_of}`} className="underline">Contract #{contract.renewal_of}</Link>
              </p>
            )}
          </>
        )}
      </div>

      {/* Renewal Form */}
      {showRenew && (
        <div className="bg-white rounded-xl border border-accent-200 p-6 shadow-sm animate-slide-down">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Renew Contract</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">New Start Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.start_date} onChange={e => setRenewForm({ ...renewForm, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">New End Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.end_date} onChange={e => setRenewForm({ ...renewForm, end_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Rent Amount *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.rent_amount} onChange={e => setRenewForm({ ...renewForm, rent_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Frequency</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.payment_frequency} onChange={e => setRenewForm({ ...renewForm, payment_frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Number of Payments *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.total_payments} onChange={e => setRenewForm({ ...renewForm, total_payments: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">New Deposit</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none" value={renewForm.deposit_amount} onChange={e => setRenewForm({ ...renewForm, deposit_amount: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => renewMutation.mutate({
                ...renewForm,
                rent_amount: Number(renewForm.rent_amount),
                total_payments: Number(renewForm.total_payments),
                deposit_amount: renewForm.deposit_amount ? Number(renewForm.deposit_amount) : null,
              })}
              disabled={!renewForm.start_date || !renewForm.end_date || !renewForm.total_payments}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors text-sm"
            >
              Create Renewal
            </button>
            <button onClick={() => setShowRenew(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-1">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{contract.total_payments}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-2">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-success-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-3">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-danger-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animate-stagger-4">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Security Deposit */}
      {contract.deposit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {editingDeposit ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-600" />
                  <h3 className="font-semibold text-gray-900">Edit Deposit</h3>
                </div>
                <button onClick={() => setEditingDeposit(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={depositForm.amount} onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={depositForm.notes} onChange={e => setDepositForm({ ...depositForm, notes: e.target.value })} />
                </div>
              </div>
              {updateDepositMutation.isError && <p className="mt-2 text-sm text-danger-600">Update failed</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => updateDepositMutation.mutate({ id: contract.deposit!.id, amount: Number(depositForm.amount), status: contract.deposit!.status, notes: depositForm.notes })} disabled={updateDepositMutation.isPending} className="flex items-center gap-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition-colors">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setEditingDeposit(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-600" />
                  <h3 className="font-semibold text-gray-900">Security Deposit</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setDepositForm({ amount: String(contract.deposit!.amount), notes: (contract.deposit as any)?.notes || '' }); setEditingDeposit(true); }} className="p-1.5 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit deposit"><Pencil className="w-3.5 h-3.5" /></button>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(contract.deposit.status)}`}>
                    {contract.deposit.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(contract.deposit.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Received</p>
                  <p className="font-medium text-gray-900">{formatDate(contract.deposit.date_received)}</p>
                </div>
                {contract.deposit.refund_amount != null && (
                  <div>
                    <p className="text-gray-500">Refunded</p>
                    <p className="font-medium text-gray-900">{formatCurrency(contract.deposit.refund_amount)} on {formatDate(contract.deposit.refund_date!)}</p>
                  </div>
                )}
              </div>
              {contract.deposit.status === 'held' && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const amount = prompt('Refund amount:', String(contract.deposit!.amount));
                      if (amount) {
                        refundMutation.mutate({
                          depositId: contract.deposit!.id,
                          refund_amount: Number(amount),
                          refund_reason: 'Contract end - deposit returned',
                        });
                      }
                    }}
                    className="text-sm px-3 py-1.5 rounded-lg border border-green-200 text-success-700 hover:bg-success-50 transition-colors"
                  >
                    Process Refund
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Contract Documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-accent-600" />
            <h3 className="font-semibold text-gray-900">Contract Documents</h3>
            {contract.files && contract.files.length > 0 && (
              <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{contract.files.length} file{contract.files.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 font-semibold shadow-sm hover:shadow text-sm disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">Accepted: PDF, Images (JPG, PNG, WebP), Word, Excel, Text. Max 20MB per file.</p>

        {uploadFilesMutation.isError && (
          <div className="mb-4 p-3 bg-danger-50 border border-red-200 rounded-lg text-sm text-danger-700">
            Upload failed: {(uploadFilesMutation.error as Error)?.message || 'Unknown error'}
          </div>
        )}

        {(!contract.files || contract.files.length === 0) ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Upload signed contracts, addendums, or supporting documents.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contract.files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.mime_type)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.original_name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size_bytes)} &middot; {formatDate(file.uploaded_at.split('T')[0] || file.uploaded_at.split(' ')[0])}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/contracts/files/${file.id}/download`}
                    className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => { if (confirm(`Delete "${file.original_name}"?`)) deleteFileMutation.mutate(file.id); }}
                    className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Contract Analysis */}
      <ContractAnalysis contractId={contract.id} files={contract.files || []} />

      {/* Payment Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Payment Schedule</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">#</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Due Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Paid Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Method</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Reference</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors animate-fade-in-fast" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <td className="px-4 py-3 text-gray-500">{p.payment_number}</td>
                <td className="px-4 py-3 text-gray-900">{formatDate(p.due_date)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>
                    {p.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                    {p.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                    {p.status === 'pending' && <Clock className="w-3 h-3" />}
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method?.replace('_', ' ') || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.reference || '-'}</td>
                <td className="px-4 py-3">
                  {(p.status === 'pending' || p.status === 'overdue') && (
                    <>
                      {payingId === p.id ? (
                        <div className="flex items-center gap-2">
                          <select className="border border-gray-200 rounded px-2 py-1 text-xs bg-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            <option value="check">Check</option>
                            <option value="bank_transfer">Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                          <input className="border border-gray-200 rounded px-2 py-1 text-xs w-24 bg-white" placeholder="Ref #" value={payRef} onChange={e => setPayRef(e.target.value)} />
                          <button
                            onClick={() => markPaidMutation.mutate({ paymentId: p.id, data: { payment_method: payMethod, reference: payRef } })}
                            className="bg-success-600 text-white px-2 py-1 rounded text-xs hover:bg-success-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button onClick={() => setPayingId(null)} className="text-gray-500 hover:text-gray-500 text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayingId(p.id)}
                          className="text-success-600 hover:text-success-700 text-xs font-medium"
                        >
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
    </div>
  );
}
