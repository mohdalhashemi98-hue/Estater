import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users, FileText, CreditCard, Shield,
  Menu, X, ChevronDown, TrendingUp, Wallet, Search, BarChart3,
  Settings, Receipt, History, FileEdit, Bell, FileBarChart, LogOut, Wrench
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';
import { motion } from 'framer-motion';
import CalendarStatus from '../calendar/CalendarStatus';
import CommandPalette from '../ui/CommandPalette';
import NotificationDropdown from '../ui/NotificationDropdown';
import MobileNav from './MobileNav';
import QuickAddFab from '../ui/QuickAddFab';

const mainNavItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/tenants', label: 'Tenants', icon: Users },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/deposits', label: 'Deposits', icon: Shield },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/portfolio', label: 'Portfolio', icon: TrendingUp },
];

const workflowItems = [
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/templates', label: 'Templates', icon: FileEdit },
  { path: '/market', label: 'Market Data', icon: BarChart3 },
  { path: '/cashflow', label: 'Cash Flow', icon: Wallet },
  { path: '/audit-log', label: 'Audit Log', icon: History },
  { path: '/settings/reminders', label: 'Reminders', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

// ---- Sidebar Content (used inside the animated sidebar) ----
function SidebarContent() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const userInitials = user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <>
      {/* Top: Logo + nav */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <SidebarLogo />

        {/* Main nav */}
        <div className="mt-6 flex flex-col gap-0.5">
          {mainNavItems.map((item) => (
            <SidebarLink
              key={item.path}
              active={isActive(item.path)}
              link={{
                label: item.label,
                href: item.path,
                icon: (
                  <item.icon className={cn(
                    'h-4 w-4 flex-shrink-0 transition-colors duration-150',
                    isActive(item.path) ? 'text-accent-500' : 'text-text-muted'
                  )} />
                ),
              }}
            />
          ))}
        </div>

        {/* Workflows section */}
        <div className="mt-6">
          <p className="px-2 mb-1.5 text-[11px] font-medium text-text-secondary uppercase tracking-wider">
            Workflows
          </p>
          <div className="flex flex-col gap-0.5">
            {workflowItems.map((item) => (
              <SidebarLink
                key={item.path}
                active={isActive(item.path)}
                link={{
                  label: item.label,
                  href: item.path,
                  icon: (
                    <item.icon className={cn(
                      'h-4 w-4 flex-shrink-0 transition-colors duration-150',
                      isActive(item.path) ? 'text-accent-500' : 'text-text-muted'
                    )} />
                  ),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: user info + logout */}
      <div className="border-t border-surface-border pt-3 flex flex-col gap-1">
        <SidebarLink
          link={{
            label: user?.name || 'User',
            href: '/settings/calendar',
            icon: (
              <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-semibold text-white">{userInitials}</span>
              </div>
            ),
          }}
        />
        <SidebarLink
          link={{
            label: 'Sign out',
            href: '#',
            icon: <LogOut className="h-4 w-4 flex-shrink-0 text-text-muted" />,
          }}
          onClick={(e) => {
            e?.preventDefault?.();
            logout();
            navigate('/');
          }}
        />
      </div>
    </>
  );
}

// ---- Logo components ----
const SidebarLogo = () => (
  <Link
    to="/dashboard"
    className="font-normal flex space-x-2.5 items-center text-sm py-1 relative z-20"
  >
    <div className="h-7 w-7 rounded-lg gradient-accent flex items-center justify-center shadow-sm flex-shrink-0">
      <Building2 className="w-3.5 h-3.5 text-white" />
    </div>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-semibold text-text-primary tracking-tight whitespace-pre"
    >
      Estater
    </motion.span>
  </Link>
);

const SidebarLogoIcon = () => (
  <Link
    to="/dashboard"
    className="font-normal flex space-x-2.5 items-center text-sm py-1 relative z-20"
  >
    <div className="h-7 w-7 rounded-lg gradient-accent flex items-center justify-center shadow-sm flex-shrink-0">
      <Building2 className="w-3.5 h-3.5 text-white" />
    </div>
  </Link>
);

// ---- Main Layout ----
export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface w-full">
      {/* Animated Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6 bg-sidebar border-r border-surface-border">
          <SidebarContent />
        </SidebarBody>
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-surface-border flex items-center px-4 lg:px-6 sticky top-0 z-30">
          {/* Centered search bar — opens command palette */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 mx-auto px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm text-text-secondary w-[320px] cursor-pointer hover:border-accent-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search for anything</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-text-secondary bg-white border border-surface-border rounded px-1.5 py-0.5 font-mono">
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-surface-border shadow-xl z-50 py-1 modal-content origin-top-right">
                    <div className="px-3 py-2 border-b border-surface-border">
                      <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <Link to="/settings/calendar" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); navigate('/'); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors w-full text-left"
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

      {/* Quick Add FAB */}
      <QuickAddFab />
    </div>
  );
}
