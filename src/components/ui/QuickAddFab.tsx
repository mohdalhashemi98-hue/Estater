import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, FileText, Upload } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: typeof Building2;
  path: string;
}

const actions: QuickAction[] = [
  { label: 'Upload Contract', icon: Upload, path: '/contracts?action=upload' },
  { label: 'New Contract', icon: FileText, path: '/contracts?action=new' },
  { label: 'New Tenant', icon: Users, path: '/tenants?action=new' },
  { label: 'New Property', icon: Building2, path: '/properties?action=new' },
];

export default function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const fabRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, close]);

  const handleAction = (path: string) => {
    close();
    const [pathname, search] = path.split('?');
    navigate({ pathname, search: search ? `?${search}` : '' });
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 hidden md:block"
          onClick={close}
        />
      )}

      {/* FAB container - hidden on mobile */}
      <div
        ref={fabRef}
        className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end gap-3"
      >
        {/* Action items */}
        {open && (
          <div className="flex flex-col items-end gap-2 mb-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => handleAction(action.path)}
                  className="flex items-center gap-2 bg-white shadow-lg rounded-full px-4 py-2.5 border border-surface-border hover:bg-surface transition-all duration-200 animate-fab-item"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <Icon className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full bg-accent-500 hover:bg-accent-600 text-white shadow-lg flex items-center justify-center transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Inline keyframe styles for staggered animation */}
      {open && (
        <style>{`
          @keyframes fab-item-in {
            from {
              opacity: 0;
              transform: scale(0.8) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-fab-item {
            animation: fab-item-in 0.2s ease-out;
          }
        `}</style>
      )}
    </>
  );
}
