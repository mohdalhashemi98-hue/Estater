import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DocumentTemplate } from '../../types';

interface Props {
  template: DocumentTemplate | null;
  onSuccess: () => void;
}

export default function TemplateEditor({ template, onSuccess }: Props) {
  const [name, setName] = useState(template?.name || '');
  const [templateType, setTemplateType] = useState(template?.template_type || 'contract');
  const [content, setContent] = useState('');

  const { data: variables } = useQuery<Record<string, string[]>>({
    queryKey: ['template-variables'],
    queryFn: () => api.get('/templates/variables'),
  });

  // Load full template if editing
  useEffect(() => {
    if (template?.id) {
      api.get<DocumentTemplate>(`/templates/${template.id}`).then(t => {
        setContent(t.content || '');
      });
    }
  }, [template?.id]);

  const mutation = useMutation({
    mutationFn: () => {
      if (template) {
        return api.put(`/templates/${template.id}`, { name, template_type: templateType, content });
      }
      return api.post('/templates', { name, template_type: templateType, content });
    },
    onSuccess,
  });

  const insertVariable = (varName: string) => {
    setContent(c => c + `{{${varName}}}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Template Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select value={templateType} onChange={e => setTemplateType(e.target.value as any)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="contract">Contract</option>
            <option value="receipt">Receipt</option>
            <option value="notice">Notice</option>
          </select>
        </div>
      </div>

      {/* Variable toolbar */}
      {variables && (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-[10px] font-medium text-gray-400 uppercase mr-2 self-center">Variables:</span>
          {Object.entries(variables).map(([group, vars]) => (
            vars.map(v => (
              <button key={v} onClick={() => insertVariable(v)}
                className="px-2 py-0.5 text-[11px] bg-white border border-gray-200 rounded text-gray-600 hover:bg-accent-50 hover:text-accent-700 hover:border-accent-200">
                {v}
              </button>
            ))
          ))}
        </div>
      )}

      {/* Split view: source + preview */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">HTML Source</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono h-[400px] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Preview</label>
          <div className="border border-gray-200 rounded-lg p-4 h-[400px] overflow-y-auto bg-white text-sm"
            dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>

      <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name || !content}
        className="w-full py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50">
        {mutation.isPending ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
      </button>
    </div>
  );
}
