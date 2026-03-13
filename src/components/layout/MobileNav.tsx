import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Users,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '../ui/dock';
import { cn } from '../../lib/utils';

const items = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/tenants', label: 'Tenants', icon: Users },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/portfolio', label: 'Portfolio', icon: TrendingUp },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <nav className="fixed bottom-2 left-0 right-0 z-40 lg:hidden safe-bottom">
      <Dock
        magnification={60}
        distance={120}
        panelHeight={52}
        className="items-end pb-2 bg-white/80 backdrop-blur-md border border-surface-border shadow-lg"
      >
        {items.map((item) => (
          <DockItem
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'aspect-square rounded-full cursor-pointer',
              isActive(item.path)
                ? 'bg-accent-100'
                : 'bg-surface-overlay'
            )}
          >
            <DockLabel>{item.label}</DockLabel>
            <DockIcon>
              <item.icon
                className={cn(
                  'h-full w-full',
                  isActive(item.path)
                    ? 'text-accent-600'
                    : 'text-text-muted'
                )}
              />
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </nav>
  );
}
