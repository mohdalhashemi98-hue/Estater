import { FileText } from 'lucide-react';

export default function AnalyzingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <div className="w-14 h-14 rounded-lg bg-accent-50 flex items-center justify-center animate-pulse">
          <FileText className="w-7 h-7 text-accent-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-500 rounded-full animate-ping" />
      </div>
      <p className="mt-4 text-sm font-medium text-text-primary">Analyzing contract with AI...</p>
      <p className="text-xs text-text-muted mt-1">This may take 15-30 seconds</p>
    </div>
  );
}
