import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { AuditLog as AuditLogType } from '../types';
import DiffView from '../components/audit/DiffView';
import { History, ChevronDown, ChevronRight } from 'lucide-react';

export default function AuditLog() {
  const [filters, setFilters] = useState({ entity_type: '', action: '', from_date: '', to_date: '' });
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const queryStr = Object.entries({ ...filters, page, limit: 50 }).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&');

  const { data } = useQuery<{ data: AuditLogType[]; total: number }>({
    queryKey: ['audit-log', queryStr],
    queryFn: () => api.get(`/audit-log?${queryStr}`),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;

  const actionColor: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700',
    update: 'bg-amber-50 text-amber-700',
    delete: 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
          <History className="w-6 h-6 text-accent-600" /> Audit Log
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Track all changes made to your data</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-surface-border p-4 animate-fade-in animate-stagger-1">
        <select value={filters.entity_type} onChange={e => { setFilters(f => ({ ...f, entity_type: e.target.value })); setPage(1); }}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white">
          <option value="">All Entities</option>
          {['property', 'tenant', 'contract', 'payment', 'expense'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filters.action} onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white">
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <input type="date" value={filters.from_date} onChange={e => { setFilters(f => ({ ...f, from_date: e.target.value })); setPage(1); }}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5" />
        <input type="date" value={filters.to_date} onChange={e => { setFilters(f => ({ ...f, to_date: e.target.value })); setPage(1); }}
          className="text-sm border border-surface-border rounded-lg px-3 py-1.5" />
        <span className="text-xs text-text-muted self-center ml-auto">{total} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden animate-fade-in animate-stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Entity ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-surface table-row-enter">
                  <td colSpan={6} className="p-0">
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="w-full flex items-center hover:bg-surface transition-all duration-200"
                    >
                      <td className="w-8 px-4 py-3">
                        <ChevronRight className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${expandedId === log.id ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="text-left px-4 py-3 text-text-muted text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="text-left px-4 py-3 text-text-secondary font-medium capitalize">{log.entity_type}</td>
                      <td className="text-left px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] || ''}`}>{log.action}</span>
                      </td>
                      <td className="text-left px-4 py-3 text-text-muted tabular-nums">{log.entity_id || '-'}</td>
                      <td className="text-left px-4 py-3 text-text-muted text-xs">{log.ip_address || '-'}</td>
                    </button>
                    {expandedId === log.id && (
                      <div className="px-4 pb-4 animate-slide-down">
                        <DiffView oldValues={log.old_values} newValues={log.new_values} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-border">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">Prev</button>
            <span className="text-xs text-text-muted">Page {page} of {Math.ceil(total / 50)}</span>
            <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
