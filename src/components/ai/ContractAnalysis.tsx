import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ContractAnalysis as ContractAnalysisType, ContractFile } from '../../types';
import AnalysisCard from './AnalysisCard';
import AnalyzingSpinner from './AnalyzingSpinner';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ContractAnalysisProps {
  contractId: number;
  files: ContractFile[];
}

export default function ContractAnalysis({ contractId, files }: ContractAnalysisProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [analyzingFileId, setAnalyzingFileId] = useState<number | null>(null);

  const { data: analyses = [] } = useQuery<ContractAnalysisType[]>({
    queryKey: ['contract-analysis', contractId],
    queryFn: () => api.get(`/contracts/${contractId}/analysis`),
  });

  const analyzeMutation = useMutation({
    mutationFn: (fileId: number) => api.post<ContractAnalysisType>(`/contracts/${contractId}/analyze/${fileId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-analysis', contractId] });
      setAnalyzingFileId(null);
    },
    onError: () => setAnalyzingFileId(null),
  });

  const handleAnalyze = (fileId: number) => {
    setAnalyzingFileId(fileId);
    analyzeMutation.mutate(fileId);
  };

  const analyzableFiles = files.filter(f =>
    f.mime_type === 'application/pdf' ||
    f.mime_type.startsWith('image/') ||
    f.mime_type.startsWith('text/')
  );

  const unanalyzedFiles = analyzableFiles.filter(f =>
    !analyses.some(a => a.file_id === f.id && a.status === 'completed')
  );

  return (
    <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-600" />
          <h3 className="font-semibold text-text-primary">AI Contract Analysis</h3>
          {analyses.filter(a => a.status === 'completed').length > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
              {analyses.filter(a => a.status === 'completed').length} analyzed
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 animate-slide-down">
          {/* Analyze buttons for unanalyzed files */}
          {unanalyzedFiles.length > 0 && (
            <div className="space-y-2">
              {unanalyzedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-surface-border">
                  <span className="text-sm text-text-primary truncate">{file.original_name}</span>
                  <button
                    onClick={() => handleAnalyze(file.id)}
                    disabled={analyzingFileId !== null}
                    className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-700 disabled:opacity-50 shadow-sm hover:shadow transition-all shrink-0 ml-3"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Analyze with AI
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {analyzingFileId !== null && <AnalyzingSpinner />}

          {/* Analysis error */}
          {analyzeMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{(analyzeMutation.error as Error).message}</p>
            </div>
          )}

          {/* Analysis results */}
          {analyses.filter(a => a.status === 'completed').length === 0 && analyzingFileId === null && analyzableFiles.length > 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              Upload a PDF or image and click "Analyze with AI" to extract contract details.
            </p>
          )}

          {analyzableFiles.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              Upload contract documents (PDF, images, or text files) to enable AI analysis.
            </p>
          )}

          {analyses
            .filter(a => a.status === 'completed')
            .map(analysis => (
              <div key={analysis.id}>
                <p className="text-xs text-text-muted mb-2">
                  Analyzed: {(analysis as any).file_name || `File #${analysis.file_id}`}
                  {analysis.analyzed_at && ` on ${new Date(analysis.analyzed_at).toLocaleDateString()}`}
                </p>
                <AnalysisCard analysis={analysis} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
