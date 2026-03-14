import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Upload, X, FileUp, Calendar, Hash, Tag } from 'lucide-react';
import { DocType } from '../../types';

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'title_deed', label: 'Title Deed' },
  { value: 'ejari', label: 'Ejari' },
  { value: 'tawtheeq', label: 'Tawtheeq' },
  { value: 'emirates_id', label: 'Emirates ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'service_charge', label: 'Service Charge' },
  { value: 'noc', label: 'NOC' },
  { value: 'trade_license', label: 'Trade License' },
  { value: 'mortgage_contract', label: 'Mortgage Contract' },
  { value: 'payment_schedule', label: 'Payment Schedule' },
  { value: 'other', label: 'Other' },
];

interface DocumentUploaderProps {
  entityType: 'property' | 'tenant' | 'contract' | 'unit';
  entityId: number;
  allowedTypes?: DocType[];
  onUploaded?: () => void;
}

export default function DocumentUploader({ entityType, entityId, allowedTypes, onUploaded }: DocumentUploaderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [docType, setDocType] = useState<DocType>('other');
  const [expiryDate, setExpiryDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const typeOptions = allowedTypes
    ? DOC_TYPE_OPTIONS.filter(o => allowedTypes.includes(o.value))
    : DOC_TYPE_OPTIONS;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);
      formData.append('entity_id', String(entityId));
      formData.append('doc_type', docType);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (referenceNumber) formData.append('reference_number', referenceNumber);
      return api.upload('/documents/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      toast.success('Uploaded');
      setSelectedFile(null);
      setExpiryDate('');
      setReferenceNumber('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded?.();
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone — more visual */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center cursor-pointer transition-all ${
          dragOver
            ? 'border-accent-500 bg-accent-50 scale-[1.01]'
            : 'border-surface-border hover:border-accent-300 hover:bg-surface'
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileSelect} />
        {selectedFile ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
              <FileUp className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{selectedFile.name}</p>
              <p className="text-[10px] text-text-muted">{(selectedFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="p-1 rounded-full hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-2">
              <Upload className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted">Drop file or tap to browse</p>
          </>
        )}
      </div>

      {/* Options row — icon labels */}
      {selectedFile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <div>
            <label className="flex items-center gap-1 text-[10px] font-medium text-text-muted mb-1">
              <Tag className="w-3 h-3" /> Type
            </label>
            <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={docType} onChange={e => setDocType(e.target.value as DocType)}>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-[10px] font-medium text-text-muted mb-1">
              <Calendar className="w-3 h-3" /> Expiry
            </label>
            <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-[10px] font-medium text-text-muted mb-1">
              <Hash className="w-3 h-3" /> Ref
            </label>
            <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              disabled={uploadMutation.isPending}
              className="w-full bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              {uploadMutation.isPending ? '...' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
