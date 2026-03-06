import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users, FileText, CreditCard, Shield,
  Menu, X, ChevronDown, TrendingUp, Wallet, Search, BarChart3,
  Settings, Receipt, History, FileEdit, Bell, FileBarChart
} from 'lucide-react';
import CalendarStatus from '../calendar/CalendarStatus';
import CommandPalette from '../ui/CommandPalette';
import NotificationDropdown from '../ui/NotificationDropdown';
import MobileNav from './MobileNav';
import { LogOut } from 'lucide-react';

const mainNavItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/tenants', label: 'Tenants', icon: Users },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/deposits', label: 'Deposits', icon: Shield },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/portfolio', label: 'Portfolio', icon: TrendingUp },
];

const workflowItems = [
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/templates', label: 'Templates', icon: FileEdit },
  { path: '/market', label: 'Market Data', icon: BarChart3 },
  { path: '/cashflow', label: 'Cash Flow', icon: Wallet },
  { path: '/audit-log', label: 'Audit Log', icon: History },
  { path: '/settings/reminders', label: 'Reminders', icon: Bell },
  { path: '/settings/calendar', label: 'Settings', icon: Settings },
];

const allNavItems = [...mainNavItems, ...workflowItems];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userInitials = user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden modal-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-white transform transition-transform duration-200 ease-out-expo
        lg:translate-x-0 lg:static lg:z-auto border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Company header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900 tracking-[-0.01em]">Estater</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="mt-2 px-2">
          <div className="space-y-0.5">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  nav-item flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150
                  ${isActive(item.path)
                    ? 'active bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                <item.icon className={`w-4 h-4 transition-colors duration-150 ${isActive(item.path) ? 'text-accent-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Workflows section */}
          <div className="mt-6">
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Workflows</p>
            <div className="space-y-0.5">
              {workflowItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    nav-item flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150
                    ${isActive(item.path)
                      ? 'active bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <item.icon className={`w-4 h-4 transition-colors duration-150 ${isActive(item.path) ? 'text-accent-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-accent-700">ES</span>
            </div>
            <div className="text-xs leading-tight">
              <p className="font-medium text-gray-900">Estater</p>
              <p className="text-gray-400">v2.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-gray-400 hover:text-gray-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Centered search bar — opens command palette */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 mx-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 w-[320px] cursor-pointer hover:border-gray-300 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search for anything</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            <CalendarStatus />
            <NotificationDropdown />
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-accent-200 transition-all"
              >
                <span className="text-[10px] font-semibold text-white">{userInitials}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 modal-content origin-top-right">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <Link to="/settings/calendar" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); navigate('/'); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Command palette */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
