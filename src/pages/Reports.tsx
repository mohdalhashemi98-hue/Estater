import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ReportType, Property } from '../types';
import { FileBarChart, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function Reports() {
  const [selectedType, setSelectedType] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [propertyId, setPropertyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const { data: reportTypes = [] } = useQuery<ReportType[]>({
    queryKey: ['report-types'],
    queryFn: () => api.get('/reports/types'),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
  });

  const selectedReport = reportTypes.find(r => r.id === selectedType);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const body: any = { report_type: selectedType, format };
      if (propertyId) body.property_id = Number(propertyId);
      if (fromDate) body.from_date = fromDate;
      if (toDate) body.to_date = toDate;

      if (format === 'json') {
        const data = await api.post('/reports/generate', { ...body, format: 'json' });
        setPreview(data);
      } else {
        const blob = await api.download('/reports/generate', body);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-accent-600" /> Reports
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and export property management reports</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 animate-fade-in animate-stagger-1">
        {/* Report type selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Report Type</label>
          <div className="grid md:grid-cols-3 gap-3">
            {reportTypes.map(rt => (
              <button key={rt.id} onClick={() => setSelectedType(rt.id)}
                className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedType === rt.id ? 'border-accent-500 bg-accent-50 scale-[1.02] shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}>
                <p className="text-sm font-medium text-gray-900">{rt.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {selectedReport?.requires_property && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Property *</label>
                  <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select property</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Format toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Format</label>
              <div className="flex gap-2">
                <button onClick={() => setFormat('pdf')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border ${
                    format === 'pdf' ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => setFormat('excel')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border ${
                    format === 'excel' ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => setFormat('json')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border ${
                    format === 'json' ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  Preview
                </button>
              </div>
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={generating || (selectedReport?.requires_property && !propertyId)}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50">
              <Download className={`w-4 h-4 ${generating ? 'animate-bounce' : ''}`} /> {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </>
        )}
      </div>

      {/* Preview table */}
      {preview && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-slide-up">
          <h3 className="text-sm font-medium text-gray-900 mb-3">{preview.title}</h3>
          <p className="text-xs text-gray-400 mb-4">Generated {new Date(preview.generated_at).toLocaleString()}</p>

          {Array.isArray(preview.data) && preview.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {Object.keys(preview.data[0]).map(k => (
                      <th key={k} className="text-left px-3 py-2 font-medium text-gray-500">{k.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.slice(0, 50).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="px-3 py-2 text-gray-700">{String(v ?? '-')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : preview.data && typeof preview.data === 'object' ? (
            <div className="space-y-2">
              {Object.entries(preview.data).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-500">{k.replace(/_/g, ' ')}</span>
                  <span className="text-gray-900 font-medium">{Array.isArray(v) ? `${(v as any[]).length} items` : String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data</p>
          )}
        </div>
      )}
    </div>
  );
}
