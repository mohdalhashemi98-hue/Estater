import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, CreditCard, Menu } from 'lucide-react';

const items = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/expenses', label: 'More', icon: Menu },
];

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] touch-target transition-colors duration-150 ${
              isActive(item.path) ? 'text-accent-600' : 'text-gray-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
