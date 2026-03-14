import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api/client';
import { Property, PROPERTY_TYPE_GROUPS, UAE_EMIRATES } from '../types';
import { formatCurrency, formatAddress } from '../utils/formatters';
import { Building2, Plus, MapPin, X, Search, LayoutGrid, List, ChevronDown, Wrench, AlertTriangle } from 'lucide-react';

interface EnrichedProperty extends Property {
  unit_count: number;
  occupied_count: number;
  vacant_count: number;
  monthly_revenue: number;
  collection_rate: number;
  outstanding_balance: number;
  next_expiry: string | null;
  maintenance_open: number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name_asc' | 'name_desc' | 'revenue_desc' | 'occupancy_asc' | 'updated_desc';
type OccupancyFilter = 'all' | 'full' | 'has_vacancies' | 'all_vacant';

const SORT_LABELS: Record<SortOption, string> = {
  name_asc: 'Name A-Z',
  name_desc: 'Name Z-A',
  revenue_desc: 'Highest Revenue',
  occupancy_asc: 'Lowest Occupancy',
  updated_desc: 'Recently Updated',
};

const ALL_TYPES = Object.values(PROPERTY_TYPE_GROUPS).flat();

function daysUntilDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Properties() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [form, setForm] = useState({
    name: '', type: 'villa', emirate: 'Dubai' as string,
    city: '', neighborhood: '', street: '', villa_number: '', notes: '',
  });

  const { data: properties = [], isLoading } = useQuery<EnrichedProperty[]>({
    queryKey: ['properties', 'enriched'],
    queryFn: () => api.get('/properties/enriched'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/properties', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowForm(false);
      setForm({ name: '', type: 'villa', emirate: 'Dubai', city: '', neighborhood: '', street: '', villa_number: '', notes: '' });
      toast.success('Property created');
    },
    onError: () => {
      toast.error('Failed to create property');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted');
    },
    onError: () => {
      toast.error('Failed to delete property');
    },
  });

  const filtered = useMemo(() => {
    let result = [...properties];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.emirate.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }

    // Emirate filter
    if (emirateFilter !== 'all') {
      result = result.filter(p => p.emirate === emirateFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter);
    }

    // Occupancy filter
    if (occupancyFilter === 'full') {
      result = result.filter(p => p.vacant_count === 0);
    } else if (occupancyFilter === 'has_vacancies') {
      result = result.filter(p => p.vacant_count > 0 && p.occupied_count > 0);
    } else if (occupancyFilter === 'all_vacant') {
      result = result.filter(p => p.occupied_count === 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'revenue_desc': return (b.monthly_revenue ?? 0) - (a.monthly_revenue ?? 0);
        case 'occupancy_asc': {
          const occA = a.unit_count > 0 ? a.occupied_count / a.unit_count : 0;
          const occB = b.unit_count > 0 ? b.occupied_count / b.unit_count : 0;
          return occA - occB;
        }
        case 'updated_desc': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default: return 0;
      }
    });

    return result;
  }, [properties, searchQuery, emirateFilter, typeFilter, occupancyFilter, sortBy]);

  const inputClass = 'w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none transition-colors';

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">Properties</h1>
          <span className="text-sm text-text-muted bg-surface-overlay px-2.5 py-0.5 rounded-full font-medium">
            {properties.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-surface-overlay rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-accent-600' : 'text-text-muted hover:text-text-secondary'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-accent-600' : 'text-text-muted hover:text-text-secondary'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 text-sm text-text-secondary border border-surface-border rounded-lg px-3 py-2 hover:bg-surface transition-colors"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-surface-border rounded-lg shadow-lg py-1 z-20 min-w-[180px]">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors ${sortBy === key ? 'text-accent-600 font-medium' : 'text-text-secondary'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Property Button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 btn-press"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, emirate, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-surface-border rounded-lg text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none transition-colors"
          >
            <option value="all">All Types</option>
            {ALL_TYPES.map(t => (
              <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>

          {/* Occupancy Filter */}
          <select
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value as OccupancyFilter)}
            className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none transition-colors"
          >
            <option value="all">All Occupancy</option>
            <option value="full">Fully Occupied</option>
            <option value="has_vacancies">Has Vacancies</option>
            <option value="all_vacant">All Vacant</option>
          </select>
        </div>

        {/* Emirate Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setEmirateFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              emirateFilter === 'all'
                ? 'bg-accent-600 text-white'
                : 'bg-surface-overlay text-text-secondary hover:bg-surface-border'
            }`}
          >
            All Emirates
          </button>
          {UAE_EMIRATES.map(e => (
            <button
              key={e}
              onClick={() => setEmirateFilter(e)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                emirateFilter === e
                  ? 'bg-accent-600 text-white'
                  : 'bg-surface-overlay text-text-secondary hover:bg-surface-border'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Create Property Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm modal-content">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary text-lg">New Property</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Property name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type *</label>
              <select className={inputClass} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(PROPERTY_TYPE_GROUPS).map(([group, types]) => (
                  <optgroup key={group} label={group}>
                    {types.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Emirate *</label>
              <select className={inputClass} value={form.emirate} onChange={e => setForm({ ...form, emirate: e.target.value })}>
                {UAE_EMIRATES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">City / Area</label>
              <input className={inputClass} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g., Jumeirah, Business Bay" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Neighborhood</label>
              <input className={inputClass} value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="e.g., Al Wasl, Marina" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Street</label>
              <input className={inputClass} value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="e.g., Al Wasl Road" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Villa / Building #</label>
              <input className={inputClass} value={form.villa_number} onChange={e => setForm({ ...form, villa_number: e.target.value })} placeholder="e.g., Villa 5, Building 12" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.emirate || createMutation.isPending}
              className="bg-accent-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors active:scale-95"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Property'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-surface-border p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-4" />
              <div className="skeleton h-3 w-full mb-3 rounded-full" />
              <div className="grid grid-cols-3 gap-3">
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && properties.length === 0 ? (
        /* True empty state - no properties at all */
        <div className="text-center py-16 bg-white rounded-xl border border-surface-border">
          <Building2 className="w-14 h-14 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No properties yet</h3>
          <p className="text-text-muted mb-6">Add your first property to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg hover:bg-accent-700 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Filtered empty state */
        <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No properties match your filters</p>
          <button
            onClick={() => { setSearchQuery(''); setEmirateFilter('all'); setTypeFilter('all'); setOccupancyFilter('all'); }}
            className="mt-3 text-sm text-accent-600 hover:text-accent-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Card View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prop, i) => {
            const unitCount = prop.unit_count ?? 0;
            const occupiedCount = prop.occupied_count ?? 0;
            const occupancyPct = unitCount > 0 ? Math.round((occupiedCount / unitCount) * 100) : 0;
            const expiryDays = daysUntilDate(prop.next_expiry);
            const collectionRate = prop.collection_rate ?? 0;

            return (
              <Link
                key={prop.id}
                to={`/properties/${prop.id}`}
                className="bg-white rounded-xl border border-surface-border p-5 shadow-sm card-hover animate-fade-in block"
                style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
              >
                {/* Top: Name + Type Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-text-primary leading-snug">{prop.name}</h3>
                  <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-surface-overlay text-text-muted capitalize">
                    {prop.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 text-sm text-text-muted mb-4">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{formatAddress(prop)}</span>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-text-secondary font-medium">{occupiedCount}/{unitCount} units occupied</span>
                    <span className="text-text-muted">{occupancyPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-overlay rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                {/* Financial Row */}
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-text-muted uppercase tracking-wide">Revenue</p>
                    <p className="text-sm font-semibold text-accent-600">
                      {formatCurrency(prop.monthly_revenue ?? 0)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-text-muted uppercase tracking-wide">Collection</p>
                    <p className={`text-sm font-semibold ${
                      collectionRate >= 90 ? 'text-emerald-600' :
                      collectionRate >= 70 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(collectionRate)}%
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-text-muted uppercase tracking-wide">Outstanding</p>
                    <p className={`text-sm font-semibold ${(prop.outstanding_balance ?? 0) > 0 ? 'text-red-600' : 'text-text-secondary'}`}>
                      {formatCurrency(prop.outstanding_balance ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Bottom Badges */}
                {(expiryDays !== null && expiryDays >= 0 && expiryDays <= 60 || (prop.maintenance_open ?? 0) > 0) && (
                  <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
                    {expiryDays !== null && expiryDays >= 0 && expiryDays <= 60 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        Expires in {expiryDays}d
                      </span>
                    )}
                    {(prop.maintenance_open ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                        <Wrench className="w-3 h-3" />
                        {prop.maintenance_open} open
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                      onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}>
                    Name {sortBy === 'name_asc' ? '\u2191' : sortBy === 'name_desc' ? '\u2193' : ''}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Emirate</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Type</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">Units</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                      onClick={() => setSortBy('occupancy_asc')}>
                    Occupancy % {sortBy === 'occupancy_asc' ? '\u2191' : ''}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                      onClick={() => setSortBy('revenue_desc')}>
                    Revenue {sortBy === 'revenue_desc' ? '\u2193' : ''}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">Collection %</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">Outstanding</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prop) => {
                  const unitCount = prop.unit_count ?? 0;
                  const occupiedCount = prop.occupied_count ?? 0;
                  const occupancyPct = unitCount > 0 ? Math.round((occupiedCount / unitCount) * 100) : 0;
                  const collectionRate = prop.collection_rate ?? 0;

                  return (
                    <tr
                      key={prop.id}
                      className="border-b border-surface-border last:border-b-0 hover:bg-surface/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link to={`/properties/${prop.id}`} className="font-medium text-text-primary hover:text-accent-600 transition-colors">
                          {prop.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{prop.emirate}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-overlay text-text-muted capitalize">
                          {prop.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{unitCount}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${occupancyPct}%` }} />
                          </div>
                          <span className="text-text-secondary text-xs font-medium">{occupancyPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-accent-600">
                        {formatCurrency(prop.monthly_revenue ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${
                          collectionRate >= 90 ? 'text-emerald-600' :
                          collectionRate >= 70 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {Math.round(collectionRate)}%
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${(prop.outstanding_balance ?? 0) > 0 ? 'text-red-600' : 'text-text-secondary'}`}>
                        {formatCurrency(prop.outstanding_balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm(`Delete "${prop.name}"?`)) {
                              deleteMutation.mutate(prop.id);
                            }
                          }}
                          className="text-text-muted hover:text-red-600 transition-colors text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
