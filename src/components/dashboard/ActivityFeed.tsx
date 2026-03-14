import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  CreditCard,
  Users,
  Shield,
  Receipt,
  Clock,
  Activity,
} from 'lucide-react';

interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  timestamp: string;
}

interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
}

const entityIcons: Record<string, React.ElementType> = {
  property: Building2,
  contract: FileText,
  payment: CreditCard,
  tenant: Users,
  deposit: Shield,
  expense: Receipt,
};

const actionColors: Record<string, { bg: string; text: string }> = {
  create: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  update: { bg: 'bg-accent-50', text: 'text-accent-500' },
  delete: { bg: 'bg-red-50', text: 'text-red-500' },
};

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function formatAction(log: AuditLog): string {
  const entity = log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1);

  switch (log.action) {
    case 'create':
      return `${entity} created`;
    case 'delete':
      return `${entity} deleted`;
    case 'update': {
      if (!log.new_values) return `${entity} updated`;
      const keys = Object.keys(log.new_values);
      if (keys.length === 1) {
        const key = keys[0];
        const value = log.new_values[key];
        if (key === 'status' && typeof value === 'string') {
          return `${entity} marked as ${value.replace(/_/g, ' ')}`;
        }
        return `${entity} ${key.replace(/_/g, ' ')} updated`;
      }
      return `${entity} updated`;
    }
    default:
      return `${entity} ${log.action.replace(/_/g, ' ')}`;
  }
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-2.5 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-surface-border" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 bg-surface-border rounded" />
        <div className="h-3 w-20 bg-surface-border rounded" />
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const { data, isLoading } = useQuery<AuditLogResponse>({
    queryKey: ['recent-activity'],
    queryFn: () => api.get('/audit-log?limit=8'),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">Recent Activity</h3>
        <Link
          to="/audit-log"
          className="text-xs text-accent-500 hover:text-accent-600 transition-colors"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Clock className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">No activity yet</span>
        </div>
      ) : (
        <div>
          {logs.map((log) => {
            const Icon = entityIcons[log.entity_type] || Activity;
            const colors = actionColors[log.action] || actionColors.update;

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2.5 border-b border-surface last:border-none"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}
                >
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {formatAction(log)}
                  </p>
                  <p className="text-xs text-text-muted">{timeAgo(log.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
