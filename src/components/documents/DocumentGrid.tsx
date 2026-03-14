import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Document as DocType } from '../../types';
import { formatDate, formatFileSize } from '../../utils/formatters';
import {
  FileText, FileImage, FileSpreadsheet, Download, Trash2,
  Clock, AlertTriangle, CheckCircle2, ShieldCheck, Stamp,
  CreditCard, BookOpen, ShieldAlert, ScrollText, Building2, FileKey, File,
  Landmark, CalendarDays
} from 'lucide-react';

const DOC_TYPE_ICONS: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  title_deed: { icon: ScrollText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ejari: { icon: Stamp, color: 'text-teal-600', bg: 'bg-teal-50' },
  tawtheeq: { icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  emirates_id: { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  passport: { icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
  visa: { icon: FileKey, color: 'text-pink-600', bg: 'bg-pink-50' },
  insurance: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
  service_charge: { icon: Building2, color: 'text-orange-600', bg: 'bg-orange-50' },
  noc: { icon: FileText, color: 'text-lime-600', bg: 'bg-lime-50' },
  trade_license: { icon: Stamp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mortgage_contract: { icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50' },
  payment_schedule: { icon: CalendarDays, color: 'text-sky-600', bg: 'bg-sky-50' },
  other: { icon: File, color: 'text-gray-500', bg: 'bg-gray-50' },
};

function mimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4 text-accent-600" />;
  if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  return <File className="w-4 h-4 text-gray-400" />;
}

function ExpiryIndicator({ expiryDate }: { expiryDate?: string }) {
  if (!expiryDate) return null;
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);

  if (daysLeft < 0) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100" title={`Expired ${formatDate(expiryDate)}`}>
        <AlertTriangle className="w-3 h-3 text-red-600" />
        <span className="text-[9px] font-bold text-red-700">EXP</span>
      </div>
    );
  }
  if (daysLeft <= 30) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100" title={`Expires ${formatDate(expiryDate)}`}>
        <Clock className="w-3 h-3 text-amber-600" />
        <span className="text-[9px] font-bold text-amber-700">{daysLeft}d</span>
      </div>
    );
  }
  return (
    <div className="px-1.5 py-0.5 rounded-md bg-emerald-100" title={`Valid until ${formatDate(expiryDate)}`}>
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
    </div>
  );
}

interface DocumentGridProps {
  entityType: 'property' | 'tenant' | 'contract' | 'unit';
  entityId: number;
}

export default function DocumentGrid({ entityType, entityId }: DocumentGridProps) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<DocType[]>({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => api.get(`/documents?entity_type=${entityType}&entity_id=${entityId}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => api.del(`/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-xl p-4 animate-pulse">
            <div className="w-10 h-10 bg-surface-overlay rounded-lg mb-2" />
            <div className="h-3 w-20 bg-surface-overlay rounded mb-1" />
            <div className="h-2 w-14 bg-surface-overlay rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-10 h-10 text-surface-border mx-auto mb-1" />
        <p className="text-xs text-text-muted">No documents</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {documents.map(doc => {
        const typeConfig = DOC_TYPE_ICONS[doc.doc_type] || DOC_TYPE_ICONS.other;
        const TypeIcon = typeConfig.icon;
        return (
          <div key={doc.id} className="bg-white rounded-xl border border-surface-border p-4 hover:shadow-sm transition-shadow group">
            {/* Header: big doc type icon + expiry */}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeConfig.bg}`}>
                <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
              </div>
              <ExpiryIndicator expiryDate={doc.expiry_date} />
            </div>

            {/* File name + mime icon */}
            <div className="flex items-center gap-1.5 mb-1">
              {mimeIcon(doc.mime_type)}
              <p className="text-sm font-medium text-text-primary truncate">{doc.original_name}</p>
            </div>

            {/* Size + ref as subtle icons */}
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <span>{formatFileSize(doc.size_bytes)}</span>
              {doc.reference_number && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-0.5"><FileKey className="w-2.5 h-2.5" />{doc.reference_number}</span>
                </>
              )}
            </div>

            {/* Action bar — icon buttons */}
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-surface-border">
              <a
                href={`/api/documents/${doc.id}/download`}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-600 hover:bg-accent-50 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => { if (confirm(`Delete "${doc.original_name}"?`)) deleteMutation.mutate(doc.id); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="ml-auto text-[9px] text-text-muted">{formatDate(doc.created_at?.split('T')[0] || doc.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
