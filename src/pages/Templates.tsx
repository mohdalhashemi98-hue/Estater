import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { DocumentTemplate, Contract } from '../types';
import TemplateEditor from '../components/templates/TemplateEditor';
import GenerateDocument from '../components/templates/GenerateDocument';
import { FileEdit, Plus, Trash2, Pencil, X, FileOutput } from 'lucide-react';

export default function Templates() {
  const qc = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [generating, setGenerating] = useState<DocumentTemplate | null>(null);

  const { data: templates = [] } = useQuery<DocumentTemplate[]>({
    queryKey: ['templates'],
    queryFn: () => api.get('/templates'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.del(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-accent-600" /> Document Templates
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Create and manage document templates for contracts, receipts, and notices</p>
        </div>
        <button onClick={() => { setEditing(null); setShowEditor(true); }} className="pill-btn bg-accent-600 text-white hover:bg-accent-700 shadow-sm btn-press">
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {/* Template list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t, i) => (
          <div key={t.id} className={`bg-white rounded-xl border border-surface-border p-5 card-hover animate-fade-in animate-stagger-${Math.min(i + 1, 6)}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-text-primary">{t.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-text-muted mt-1 inline-block">{t.template_type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(t); setShowEditor(true); }} className="p-1.5 text-text-muted hover:text-text-secondary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setGenerating(t)} className="p-1.5 text-text-muted hover:text-accent-600 transition-colors"><FileOutput className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm('Delete template?')) deleteMut.mutate(t.id); }} className="p-1.5 text-text-muted hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">Updated {new Date(t.updated_at).toLocaleDateString()}</p>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-surface-border p-8 text-center text-text-muted text-sm animate-fade-in">
            No templates yet. Create your first template to get started.
          </div>
        )}
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-10 overflow-y-auto modal-backdrop">
          <div className="bg-white rounded-xl border border-surface-border shadow-xl w-full max-w-4xl p-6 modal-content my-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowEditor(false)} className="text-text-muted hover:text-text-secondary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <TemplateEditor
              template={editing}
              onSuccess={() => { setShowEditor(false); qc.invalidateQueries({ queryKey: ['templates'] }); }}
            />
          </div>
        </div>
      )}

      {/* Generate modal */}
      {generating && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-10 overflow-y-auto modal-backdrop">
          <div className="bg-white rounded-xl border border-surface-border shadow-xl w-full max-w-3xl p-6 modal-content my-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate Document — {generating.name}</h2>
              <button onClick={() => setGenerating(null)} className="text-text-muted hover:text-text-secondary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <GenerateDocument template={generating} />
          </div>
        </div>
      )}
    </div>
  );
}
