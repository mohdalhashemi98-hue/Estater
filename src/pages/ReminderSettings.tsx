import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ReminderSetting, ReminderLog } from '../types';
import { Bell, Plus, Trash2 } from 'lucide-react';

export default function ReminderSettings() {
  const qc = useQueryClient();
  const [newType, setNewType] = useState('payment_due');
  const [newDays, setNewDays] = useState(7);

  const { data: settings = [] } = useQuery<ReminderSetting[]>({
    queryKey: ['reminder-settings'],
    queryFn: () => api.get('/reminders/settings'),
  });

  const { data: logs = [] } = useQuery<ReminderLog[]>({
    queryKey: ['reminder-logs'],
    queryFn: () => api.get('/reminders/logs?limit=20'),
  });

  const toggleMut = useMutation({
    mutationFn: (s: ReminderSetting) => api.put(`/reminders/settings/${s.id}`, { ...s, enabled: s.enabled ? 0 : 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });

  const addMut = useMutation({
    mutationFn: () => api.post('/reminders/settings', { reminder_type: newType, days_before: newDays, enabled: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.del(`/reminders/settings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });

  const typeLabel: Record<string, string> = {
    payment_due: 'Payment Due',
    contract_expiry: 'Contract Expiry',
    maintenance: 'Maintenance',
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
          <Bell className="w-6 h-6 text-accent-600" /> Reminder Settings
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Configure automated reminders for payments and contracts</p>
      </div>

      {/* Settings table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden animate-fade-in animate-stagger-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Days Before</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Method</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Enabled</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id} className="border-b border-surface table-row-enter">
                <td className="px-4 py-3 text-text-secondary font-medium">{typeLabel[s.reminder_type] || s.reminder_type}</td>
                <td className="px-4 py-3 text-text-secondary">{s.days_before} days</td>
                <td className="px-4 py-3 text-text-muted capitalize">{s.notification_method}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleMut.mutate(s)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${s.enabled ? 'bg-accent-600' : 'bg-surface-border'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(s.id); }} className="text-text-muted hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add new */}
        <div className="flex items-center gap-3 p-4 border-t border-surface-border bg-surface">
          <select value={newType} onChange={e => setNewType(e.target.value)}
            className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white">
            <option value="payment_due">Payment Due</option>
            <option value="contract_expiry">Contract Expiry</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <input type="number" min="1" value={newDays} onChange={e => setNewDays(Number(e.target.value))}
            className="w-20 text-sm border border-surface-border rounded-lg px-3 py-1.5" placeholder="Days" />
          <span className="text-xs text-text-muted">days before</span>
          <button onClick={() => addMut.mutate()} className="pill-btn bg-accent-600 text-white hover:bg-accent-700 text-xs">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      {/* Recent logs */}
      <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-2">
        <h3 className="text-sm font-medium text-text-primary mb-4">Recent Reminder Logs</h3>
        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-xs py-2 border-b border-surface">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 font-medium">{typeLabel[log.reminder_type] || log.reminder_type}</span>
                  <span className="text-text-muted">{log.entity_type} #{log.entity_id}</span>
                </div>
                <span className="text-text-muted">{new Date(log.triggered_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">No reminders sent yet</p>
        )}
      </div>
    </div>
  );
}
