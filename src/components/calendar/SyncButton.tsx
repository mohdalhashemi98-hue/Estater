import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CalendarStatus } from '../../types';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface SyncButtonProps {
  contractId: number;
}

export default function SyncButton({ contractId }: SyncButtonProps) {
  const queryClient = useQueryClient();

  const { data: status } = useQuery<CalendarStatus>({
    queryKey: ['calendar-status'],
    queryFn: () => api.get('/calendar/status'),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/calendar/sync/contract/${contractId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-status'] });
    },
  });

  if (!status?.connected) return null;

  return (
    <button
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-surface-border text-text-secondary hover:bg-surface transition-colors disabled:opacity-50"
      title="Sync deadlines to Google Calendar"
    >
      {syncMutation.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : syncMutation.isSuccess ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Calendar className="w-3.5 h-3.5" />
      )}
      {syncMutation.isPending ? 'Syncing...' : syncMutation.isSuccess ? 'Synced!' : 'Sync to Calendar'}
    </button>
  );
}
