import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CalendarStatus as CalendarStatusType } from '../../types';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function CalendarStatus() {
  const { data: status } = useQuery<CalendarStatusType>({
    queryKey: ['calendar-status'],
    queryFn: () => api.get('/calendar/status'),
    refetchInterval: 60000,
  });

  if (!status) return null;

  return (
    <Link
      to="/settings/calendar"
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-surface-border transition-colors hover:bg-surface"
      title={status.connected ? `${status.events_synced} events synced` : 'Calendar not connected'}
    >
      <Calendar className="w-3.5 h-3.5 text-text-muted" />
      {status.connected ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="text-text-secondary">Calendar</span>
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 text-text-muted" />
          <span className="text-text-muted">Calendar</span>
        </>
      )}
    </Link>
  );
}
