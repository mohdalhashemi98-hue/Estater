import { ContractAnalysis } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Calendar, AlertCircle, FileText, Users, Flag } from 'lucide-react';

interface AnalysisCardProps {
  analysis: ContractAnalysis;
}

const importanceBadge = (importance: string) => {
  switch (importance) {
    case 'high': return 'bg-red-50 text-red-700 border-red-200';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low': return 'bg-gray-50 text-gray-500 border-gray-200';
    default: return 'bg-gray-50 text-gray-500 border-gray-200';
  }
};

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  if (analysis.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-sm font-medium text-red-700">Analysis failed</p>
        </div>
        {analysis.error_message && (
          <p className="mt-2 text-sm text-red-600">{analysis.error_message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analysis.summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-accent-600" />
            <h4 className="font-semibold text-sm text-gray-900">AI Summary</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
        </div>
      )}

      {(analysis.extracted_start_date || analysis.extracted_end_date) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent-600" />
            <h4 className="font-semibold text-sm text-gray-900">Extracted Dates</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">{analysis.extracted_start_date ? formatDate(analysis.extracted_start_date) : 'Not found'}</p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">{analysis.extracted_end_date ? formatDate(analysis.extracted_end_date) : 'Not found'}</p>
            </div>
          </div>
          {analysis.extracted_payment_due && analysis.extracted_payment_due.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm">Payment Due</p>
              <ul className="mt-1 space-y-1">
                {analysis.extracted_payment_due.map((d, i) => (
                  <li key={i} className="text-sm text-gray-900">{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysis.key_terms && analysis.key_terms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Key Terms</h4>
          <div className="space-y-2">
            {analysis.key_terms.map((term, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${importanceBadge(term.importance)}`}>
                  {term.importance}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{term.term}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{term.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.obligations && analysis.obligations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent-600" />
            <h4 className="font-semibold text-sm text-gray-900">Obligations</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {['landlord', 'tenant'].map(party => {
              const items = analysis.obligations!.filter(o => o.party === party);
              if (items.length === 0) return null;
              return (
                <div key={party}>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{party}</p>
                  <ul className="space-y-1.5">
                    {items.map((o, i) => (
                      <li key={i} className="text-sm text-gray-900 flex items-start gap-2">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5" />
                        <span>{o.obligation}{o.deadline && <span className="text-gray-400"> (by {o.deadline})</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysis.milestones && analysis.milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-accent-600" />
            <h4 className="font-semibold text-sm text-gray-900">Milestones</h4>
          </div>
          <div className="space-y-2">
            {analysis.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="shrink-0 font-medium text-accent-600">{formatDate(m.date)}</span>
                <span className="text-gray-900">{m.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
