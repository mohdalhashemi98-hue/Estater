import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Property, Tenant, Contract } from '../../types';
import { Search, Building2, Users, FileText, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'property' | 'tenant' | 'contract' | 'page';
  id?: number;
  label: string;
  sublabel: string;
  path: string;
  icon: typeof Building2;
}

const pages: SearchResult[] = [
  { type: 'page', label: 'Dashboard', sublabel: 'Home overview', path: '/', icon: Search },
  { type: 'page', label: 'Properties', sublabel: 'Manage properties', path: '/properties', icon: Building2 },
  { type: 'page', label: 'Tenants', sublabel: 'Manage tenants', path: '/tenants', icon: Users },
  { type: 'page', label: 'Contracts', sublabel: 'Manage contracts', path: '/contracts', icon: FileText },
  { type: 'page', label: 'Payments', sublabel: 'View payments', path: '/payments', icon: Search },
  { type: 'page', label: 'Deposits', sublabel: 'Security deposits', path: '/deposits', icon: Search },
  { type: 'page', label: 'Portfolio', sublabel: 'Property valuations', path: '/portfolio', icon: Search },
  { type: 'page', label: 'Market Data', sublabel: 'DLD transactions', path: '/market', icon: Search },
  { type: 'page', label: 'Cash Flow', sublabel: 'Rent vs mortgages', path: '/cashflow', icon: Search },
  { type: 'page', label: 'Calendar Settings', sublabel: 'Google Calendar sync', path: '/settings/calendar', icon: Search },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties'),
    enabled: open,
    staleTime: 30000,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants'),
    enabled: open,
    staleTime: 30000,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: () => api.get('/contracts'),
    enabled: open,
    staleTime: 30000,
  });

  const results: SearchResult[] = (() => {
    if (!query.trim()) return pages.slice(0, 6);

    const q = query.toLowerCase();
    const matched: SearchResult[] = [];

    // Search properties
    properties
      .filter(p => p.name.toLowerCase().includes(q) || p.emirate.toLowerCase().includes(q) || (p.city && p.city.toLowerCase().includes(q)))
      .slice(0, 4)
      .forEach(p => matched.push({
        type: 'property', id: p.id, label: p.name,
        sublabel: `${p.type} — ${p.emirate}${p.city ? `, ${p.city}` : ''}`,
        path: `/properties/${p.id}`, icon: Building2,
      }));

    // Search tenants
    tenants
      .filter(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) || (t.phone && t.phone.includes(q)) || (t.email && t.email.toLowerCase().includes(q)))
      .slice(0, 4)
      .forEach(t => matched.push({
        type: 'tenant', id: t.id, label: `${t.first_name} ${t.last_name}`,
        sublabel: t.phone + (t.company_name ? ` — ${t.company_name}` : ''),
        path: `/tenants/${t.id}`, icon: Users,
      }));

    // Search contracts
    contracts
      .filter(c => (c.tenant_name && c.tenant_name.toLowerCase().includes(q)) || (c.property_name && c.property_name.toLowerCase().includes(q)))
      .slice(0, 4)
      .forEach(c => matched.push({
        type: 'contract', id: c.id, label: `${c.tenant_name} — ${c.property_name}`,
        sublabel: `${c.status} — ${c.unit_number}`,
        path: `/contracts/${c.id}`, icon: FileText,
      }));

    // Search pages
    pages
      .filter(p => p.label.toLowerCase().includes(q) || p.sublabel.toLowerCase().includes(q))
      .forEach(p => matched.push(p));

    return matched.slice(0, 8);
  })();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const goTo = useCallback((result: SearchResult) => {
    navigate(result.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      goTo(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-surface-border w-full max-w-[520px] overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search properties, tenants, contracts..."
            className="flex-1 text-sm text-text-primary placeholder-text-secondary outline-none bg-transparent"
          />
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No results found</p>
          ) : (
            <>
              {!query.trim() && (
                <p className="px-4 py-1.5 text-[11px] font-medium text-text-secondary uppercase tracking-wider">Quick navigation</p>
              )}
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id ?? result.label}`}
                  onClick={() => goTo(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent-50' : 'hover:bg-surface'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    result.type === 'property' ? 'bg-blue-50 text-blue-600' :
                    result.type === 'tenant' ? 'bg-emerald-50 text-emerald-600' :
                    result.type === 'contract' ? 'bg-amber-50 text-amber-600' :
                    'bg-surface text-text-muted'
                  }`}>
                    <result.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{result.label}</p>
                    <p className="text-xs text-text-muted truncate">{result.sublabel}</p>
                  </div>
                  {i === selectedIndex && (
                    <ArrowRight className="w-3.5 h-3.5 text-accent-500 shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-surface-border flex items-center gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono text-[10px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono text-[10px]">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono text-[10px]">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
