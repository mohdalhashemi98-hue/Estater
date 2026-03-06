import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Contract, Payment } from '../../types';
import { Bell, AlertTriangle, CalendarClock, CreditCard, X } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil } from '../../utils/formatters';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: overdue = [] } = useQuery<Payment[]>({
    queryKey: ['dashboard-overdue'],
    queryFn: () => api.get('/dashboard/overdue-payments'),
    refetchInterval: 60000,
  });

  const { data: expiring = [] } = useQuery<Contract[]>({
    queryKey: ['dashboard-expiring'],
    queryFn: () => api.get('/dashboard/expiring-contracts?days=30'),
    refetchInterval: 60000,
  });

  const totalCount = overdue.length + expiring.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-400 hover:text-gray-600 transition-colors p-1"
      >
        <Bell className="w-[18px] h-[18px]" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{totalCount > 9 ? '9+' : totalCount}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl border border-gray-200 shadow-xl z-50 animate-scale-in origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {totalCount === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              <>
                {/* Overdue payments */}
                {overdue.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Overdue Payments ({overdue.length})
                    </p>
                    {overdue.slice(0, 5).map(p => (
                      <Link
                        key={p.id}
                        to={`/contracts/${p.contract_id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.tenant_name}</p>
                          <p className="text-xs text-gray-400 truncate">{p.property_name} — {p.unit_number}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-red-600 tabular-nums">{formatCurrency(p.amount)}</p>
                          <p className="text-[11px] text-gray-400">Due {formatDate(p.due_date)}</p>
                        </div>
                      </Link>
                    ))}
                    {overdue.length > 5 && (
                      <Link to="/payments?status=overdue" onClick={() => setOpen(false)} className="block px-4 py-2 text-xs text-accent-600 hover:text-accent-700 font-medium">
                        View all {overdue.length} overdue
                      </Link>
                    )}
                  </div>
                )}

                {/* Expiring contracts */}
                {expiring.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Expiring Soon ({expiring.length})
                    </p>
                    {expiring.slice(0, 5).map(c => (
                      <Link
                        key={c.id}
                        to={`/contracts/${c.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.tenant_name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.property_name} — {c.unit_number}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-amber-600">{daysUntil(c.end_date)}d</p>
                          <p className="text-[11px] text-gray-400">{formatDate(c.end_date)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {totalCount > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                to="/payments"
                onClick={() => setOpen(false)}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium"
              >
                View all payments
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
