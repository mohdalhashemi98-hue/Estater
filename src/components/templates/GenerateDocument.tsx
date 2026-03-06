import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DocumentTemplate, Contract } from '../../types';
import { Download } from 'lucide-react';

interface Props {
  template: DocumentTemplate;
}

export default function GenerateDocument({ template }: Props) {
  const [contractId, setContractId] = useState('');
  const [preview, setPreview] = useState('');

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: () => api.get('/contracts'),
  });

  const previewMut = useMutation({
    mutationFn: () => api.post<{ html: string }>(`/templates/${template.id}/generate`, { contract_id: Number(contractId) }),
    onSuccess: (data) => setPreview((data as any).html),
  });

  const downloadPdf = async () => {
    const blob = await api.download(`/templates/${template.id}/generate-pdf`, { contract_id: Number(contractId) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Select Contract</label>
        <select value={contractId} onChange={e => setContractId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Choose a contract...</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>
              #{c.id} — {c.tenant_name} — {c.property_name} ({c.unit_number})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={() => previewMut.mutate()} disabled={!contractId || previewMut.isPending}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50">
          {previewMut.isPending ? 'Generating...' : 'Preview'}
        </button>
        {preview && (
          <button onClick={downloadPdf} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        )}
      </div>

      {preview && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white overflow-y-auto max-h-[500px] text-sm"
          dangerouslySetInnerHTML={{ __html: preview }} />
      )}
    </div>
  );
}
