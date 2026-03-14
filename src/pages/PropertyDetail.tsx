import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Property, Unit, Mortgage, PropertyValuation, PROPERTY_TYPE_GROUPS, UAE_EMIRATES } from '../types';
import { statusColor, formatCurrency, formatDate, formatAddress } from '../utils/formatters';
import { Plus, ArrowLeft, X, Bed, Bath, Ruler, Landmark, TrendingUp, BarChart3, Loader2, Home, Pencil, Trash2, Check, FileText, Building2, Users, DollarSign, Wrench, Upload, AlertCircle } from 'lucide-react';
import MortgageForm from '../components/mortgage/MortgageForm';
import MortgageCard from '../components/mortgage/MortgageCard';
import ValuationChart from '../components/charts/ValuationChart';
import GainLossIndicator from '../components/ui/GainLossIndicator';
import PropertyMap from '../components/maps/PropertyMap';
import { toast } from 'sonner';

type TabId = 'overview' | 'units' | 'financials' | 'maintenance' | 'documents';

interface MaintenanceRequest {
  id: number;
  property_id: number;
  property_name?: string;
  unit_number?: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  cost?: number;
  vendor_name?: string;
  created_at: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'units', label: 'Units & Tenants' },
  { id: 'financials', label: 'Financials' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'documents', label: 'Documents' },
];

function maintenanceStatusColor(status: string) {
  switch (status) {
    case 'reported': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'resolved': return 'bg-emerald-100 text-emerald-800';
    case 'cancelled': return 'bg-surface-overlay text-text-muted';
    default: return 'bg-surface-overlay text-text-muted';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-text-muted';
    default: return 'text-text-muted';
  }
}

export default function PropertyDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showMortgageForm, setShowMortgageForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ unit_number: '', floor: '', bedrooms: '', bathrooms: '', area_sqm: '', notes: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: '', emirate: '', city: '', neighborhood: '', street: '', villa_number: '', notes: '' });
  const [editingUnit, setEditingUnit] = useState<number | null>(null);
  const [editUnitForm, setEditUnitForm] = useState({ unit_number: '', floor: '', bedrooms: '', bathrooms: '', area_sqm: '' });

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`),
  });

  const { data: mortgages = [] } = useQuery<Mortgage[]>({
    queryKey: ['property-mortgages', id],
    queryFn: () => api.get(`/properties/${id}/mortgages`),
  });

  const { data: valuations = [] } = useQuery<PropertyValuation[]>({
    queryKey: ['valuations', id],
    queryFn: () => api.get(`/properties/${id}/valuations`),
  });

  const { data: marketEstimate } = useQuery<any>({
    queryKey: ['market-estimate', id],
    queryFn: () => api.get(`/market/properties/${id}/estimated-value`),
  });

  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ['property-contracts', id],
    queryFn: () => api.get(`/contracts?property_id=${id}`),
    enabled: activeTab === 'units',
  });

  const { data: maintenanceRequests = [] } = useQuery<MaintenanceRequest[]>({
    queryKey: ['property-maintenance', id],
    queryFn: () => api.get(`/maintenance?property_id=${id}`),
    enabled: activeTab === 'maintenance',
  });

  const autoMatchMutation = useMutation({
    mutationFn: () => api.post(`/market/properties/${id}/auto-match`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['market-estimate', id] });
      toast.success('Market match updated');
    },
    onError: () => {
      toast.error('Failed to auto-match property');
    },
  });

  const addUnitMutation = useMutation({
    mutationFn: (data: any) => api.post(`/properties/${id}/units`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setShowUnitForm(false);
      setUnitForm({ unit_number: '', floor: '', bedrooms: '', bathrooms: '', area_sqm: '', notes: '' });
      toast.success('Unit added');
    },
    onError: () => {
      toast.error('Failed to add unit');
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: (data: any) => api.put(`/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setEditing(false);
      toast.success('Property updated');
    },
    onError: () => {
      toast.error('Failed to update property');
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: () => api.del(`/properties/${id}`),
    onSuccess: () => {
      window.location.href = '/properties';
      toast.success('Property deleted');
    },
    onError: () => {
      toast.error('Failed to delete property');
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }: { unitId: number; data: any }) => api.put(`/properties/units/${unitId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setEditingUnit(null);
      toast.success('Unit updated');
    },
    onError: () => {
      toast.error('Failed to update unit');
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => api.del(`/properties/units/${unitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Unit deleted');
    },
    onError: () => {
      toast.error('Failed to delete unit');
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-surface-border border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
  if (!property) return <p className="text-red-600">Property not found</p>;

  const chartData = [...valuations]
    .sort((a, b) => a.valuation_date.localeCompare(b.valuation_date))
    .map(v => ({ date: v.valuation_date, value: v.estimated_value }));

  if (property.purchase_price && property.purchase_date) {
    if (!chartData.find(d => d.date === property.purchase_date)) {
      chartData.unshift({ date: property.purchase_date!, value: property.purchase_price });
    }
  }

  const gainLoss = property.current_estimated_value && property.purchase_price
    ? property.current_estimated_value - property.purchase_price
    : 0;
  const gainLossPercent = property.purchase_price && property.purchase_price > 0
    ? (gainLoss / property.purchase_price) * 100
    : 0;

  // Key metrics calculations
  const units = property.units || [];
  const totalUnits = property.unit_count ?? units.length;
  const occupiedUnits = property.occupied_count ?? units.filter(u => u.status === 'occupied').length;
  const occupancyPercent = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Build a map of unit_id -> active contract for the units table
  const activeContractsByUnit: Record<number, any> = {};
  if (contracts.length > 0) {
    for (const c of contracts) {
      if (c.status === 'active' && c.unit_id) {
        activeContractsByUnit[c.unit_id] = c;
      }
    }
  }

  // Monthly revenue from active contracts
  const monthlyRevenue = contracts
    .filter((c: any) => c.status === 'active')
    .reduce((sum: number, c: any) => {
      if (c.payment_frequency === 'monthly') return sum + (c.rent_amount || 0);
      if (c.payment_frequency === 'quarterly') return sum + (c.rent_amount || 0) / 3;
      if (c.payment_frequency === 'semi_annual') return sum + (c.rent_amount || 0) / 6;
      if (c.payment_frequency === 'annual') return sum + (c.rent_amount || 0) / 12;
      return sum + (c.rent_amount || 0);
    }, 0);

  const openMaintenanceCount = maintenanceRequests.filter(
    r => r.status === 'reported' || r.status === 'in_progress'
  ).length;

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Back Link */}
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </Link>

      {/* Property Header */}
      <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
        {editing ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text-primary">Edit Property</h3>
              <button onClick={() => setEditing(false)} className="text-text-muted hover:text-text-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Name *</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
                <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  {Object.entries(PROPERTY_TYPE_GROUPS).map(([group, types]) => (
                    <optgroup key={group} label={group}>
                      {types.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Emirate</label>
                <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.emirate} onChange={e => setEditForm({ ...editForm, emirate: e.target.value })}>
                  {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">City / Area</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Neighborhood</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.neighborhood} onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Street</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.street} onChange={e => setEditForm({ ...editForm, street: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Villa / Building #</label>
                <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={editForm.villa_number} onChange={e => setEditForm({ ...editForm, villa_number: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
                <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => updatePropertyMutation.mutate(editForm)} disabled={!editForm.name} className="bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition-colors">Save Changes</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{property.name}</h2>
                <p className="text-text-muted text-sm mt-0.5">{formatAddress(property)}</p>
                <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-surface-overlay text-text-muted capitalize">{property.type}</span>
              </div>
              <div className="flex items-start gap-3">
                {property.current_estimated_value && (
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-text-primary tabular-nums">{formatCurrency(property.current_estimated_value)}</p>
                    {property.purchase_price && (
                      <GainLossIndicator value={gainLoss} percent={gainLossPercent} size="sm" />
                    )}
                  </div>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditForm({
                        name: property.name, type: property.type, emirate: property.emirate,
                        city: property.city || '', neighborhood: property.neighborhood || '',
                        street: property.street || '', villa_number: property.villa_number || '',
                        notes: property.notes || '',
                      });
                      setEditing(true);
                    }}
                    className="p-2 text-text-muted hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${property.name}"? This will also delete all units.`)) deletePropertyMutation.mutate(); }}
                    className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {property.notes && <p className="mt-3 text-sm text-text-muted">{property.notes}</p>}
          </>
        )}
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-accent-600" />
            <p className="text-xs font-medium text-text-muted">Total Units</p>
          </div>
          <p className="text-2xl font-semibold text-text-primary tabular-nums">{totalUnits}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-accent-600" />
            <p className="text-xs font-medium text-text-muted">Occupancy</p>
          </div>
          <p className="text-2xl font-semibold text-text-primary tabular-nums">
            {occupancyPercent}%
            <span className="text-xs font-normal text-text-muted ml-1">{occupiedUnits}/{totalUnits}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-medium text-text-muted">Monthly Revenue</p>
          </div>
          <p className="text-2xl font-semibold text-text-primary tabular-nums">
            {monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '--'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-medium text-text-muted">Open Maintenance</p>
          </div>
          <p className="text-2xl font-semibold text-text-primary tabular-nums">{openMaintenanceCount}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-surface-border">
        <nav className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-accent-500 text-accent-600 font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Property Map */}
          <PropertyMap address={formatAddress(property)} propertyName={property.name} />

          {/* Mini Valuation Chart */}
          {chartData.length > 1 && (
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-600" />
                  <h3 className="font-semibold text-sm text-text-primary">Property Value</h3>
                </div>
                <Link to={`/properties/${id}/valuation`} className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                  View Full History
                </Link>
              </div>
              <ValuationChart
                data={chartData}
                purchasePrice={property.purchase_price}
                height={200}
              />
            </div>
          )}

          {/* Market Match */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-600" />
                <h3 className="font-semibold text-sm text-text-primary">DLD Market Match</h3>
              </div>
              <button
                onClick={() => autoMatchMutation.mutate()}
                disabled={autoMatchMutation.isPending}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-accent-200 text-accent-600 hover:bg-accent-50 transition-colors disabled:opacity-50"
              >
                {autoMatchMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                Auto-Match
              </button>
            </div>
            {marketEstimate?.available ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">DLD Estimated Value</p>
                  <p className="text-lg font-semibold text-accent-600">{formatCurrency(marketEstimate.estimated_value)}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Price / sqm</p>
                  <p className="text-lg font-semibold text-text-primary">AED {marketEstimate.price_per_sqm?.toLocaleString()}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Based On</p>
                  <p className="text-lg font-semibold text-text-primary">{marketEstimate.based_on} transactions</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Range</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(marketEstimate.range?.low)} - {formatCurrency(marketEstimate.range?.high)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-text-muted">No market match yet. Click "Auto-Match" to link this property to DLD transaction data.</p>
              </div>
            )}
            {autoMatchMutation.isSuccess && autoMatchMutation.data && (
              <p className="mt-3 text-sm text-emerald-600">
                {(autoMatchMutation.data as any).matched
                  ? `Matched to ${(autoMatchMutation.data as any).area} / ${(autoMatchMutation.data as any).building}`
                  : 'No matching DLD data found. Try updating the property name or area.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== UNITS & TENANTS TAB ===== */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Add Unit Button + Form */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-text-primary">Units ({units.length})</h3>
            <button
              onClick={() => setShowUnitForm(true)}
              className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Unit
            </button>
          </div>

          {showUnitForm && (
            <div className="bg-white rounded-xl border border-surface-border p-5 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm text-text-primary">New Unit</h3>
                <button onClick={() => setShowUnitForm(false)} className="text-text-muted hover:text-text-secondary"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Unit Number *</label>
                  <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={unitForm.unit_number} onChange={e => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="e.g., 101, A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Floor</label>
                  <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={unitForm.floor} onChange={e => setUnitForm({ ...unitForm, floor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Bedrooms</label>
                  <input type="number" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={unitForm.bedrooms} onChange={e => setUnitForm({ ...unitForm, bedrooms: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Bathrooms</label>
                  <input type="number" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={unitForm.bathrooms} onChange={e => setUnitForm({ ...unitForm, bathrooms: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Area (sqm)</label>
                  <input type="number" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" value={unitForm.area_sqm} onChange={e => setUnitForm({ ...unitForm, area_sqm: e.target.value })} />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => addUnitMutation.mutate({
                    ...unitForm,
                    bedrooms: unitForm.bedrooms ? Number(unitForm.bedrooms) : null,
                    bathrooms: unitForm.bathrooms ? Number(unitForm.bathrooms) : null,
                    area_sqm: unitForm.area_sqm ? Number(unitForm.area_sqm) : null,
                  })}
                  disabled={!unitForm.unit_number}
                  className="bg-accent-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors"
                >
                  Add Unit
                </button>
              </div>
            </div>
          )}

          {/* Inline edit form for a unit (shown instead of the table row) */}
          {editingUnit !== null && (
            <div className="bg-white rounded-xl border border-surface-border p-5 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-text-primary text-sm">Edit Unit</h4>
                <button onClick={() => setEditingUnit(null)} className="text-text-muted hover:text-text-secondary"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid md:grid-cols-5 gap-3">
                <input className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Unit #" value={editUnitForm.unit_number} onChange={e => setEditUnitForm({ ...editUnitForm, unit_number: e.target.value })} />
                <input className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Floor" value={editUnitForm.floor} onChange={e => setEditUnitForm({ ...editUnitForm, floor: e.target.value })} />
                <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Beds" value={editUnitForm.bedrooms} onChange={e => setEditUnitForm({ ...editUnitForm, bedrooms: e.target.value })} />
                <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Baths" value={editUnitForm.bathrooms} onChange={e => setEditUnitForm({ ...editUnitForm, bathrooms: e.target.value })} />
                <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Area sqm" value={editUnitForm.area_sqm} onChange={e => setEditUnitForm({ ...editUnitForm, area_sqm: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => updateUnitMutation.mutate({ unitId: editingUnit, data: { ...editUnitForm, bedrooms: editUnitForm.bedrooms ? Number(editUnitForm.bedrooms) : null, bathrooms: editUnitForm.bathrooms ? Number(editUnitForm.bathrooms) : null, area_sqm: editUnitForm.area_sqm ? Number(editUnitForm.area_sqm) : null } })} disabled={!editUnitForm.unit_number} className="bg-accent-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors">Save</button>
                <button onClick={() => setEditingUnit(null)} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-surface transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Units Table */}
          {units.length > 0 ? (
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Unit #</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Floor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Beds</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Baths</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Area</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Tenant</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Rent</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit: Unit) => {
                      const contract = activeContractsByUnit[unit.id];
                      return (
                        <tr key={unit.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-text-primary">{unit.unit_number}</td>
                          <td className="px-4 py-3 text-text-muted">{unit.floor || '--'}</td>
                          <td className="px-4 py-3 text-text-muted">{unit.bedrooms != null ? unit.bedrooms : '--'}</td>
                          <td className="px-4 py-3 text-text-muted">{unit.bathrooms != null ? unit.bathrooms : '--'}</td>
                          <td className="px-4 py-3 text-text-muted">{unit.area_sqm != null ? `${unit.area_sqm} sqm` : '--'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(unit.status)}`}>
                              {unit.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {unit.status === 'occupied' && contract ? (
                              <div>
                                <p className="text-text-primary text-xs font-medium">{contract.tenant_name || 'Tenant'}</p>
                                <p className="text-text-muted text-[11px]">Ends {formatDate(contract.end_date)}</p>
                              </div>
                            ) : unit.status === 'vacant' ? (
                              <Link to="/contracts" className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
                                <FileText className="w-3 h-3" /> Create Contract
                              </Link>
                            ) : (
                              <span className="text-xs text-text-muted">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {contract ? (
                              <span className="text-xs text-text-primary font-medium tabular-nums">{formatCurrency(contract.rent_amount)}</span>
                            ) : (
                              <span className="text-xs text-text-muted">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingUnit(unit.id);
                                  setEditUnitForm({
                                    unit_number: unit.unit_number,
                                    floor: unit.floor || '',
                                    bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : '',
                                    bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : '',
                                    area_sqm: unit.area_sqm != null ? String(unit.area_sqm) : '',
                                  });
                                }}
                                className="p-1.5 text-text-muted hover:text-accent-600 rounded transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { if (confirm(`Delete unit ${unit.unit_number}?`)) deleteUnitMutation.mutate(unit.id); }}
                                className="p-1.5 text-text-muted hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !showUnitForm && (
            <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
              <Home className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted text-sm">No units yet. Add units to this property.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== FINANCIALS TAB ===== */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Revenue / Expense Summary */}
          {contracts.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-text-primary">Revenue Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Active Contracts</p>
                  <p className="text-lg font-semibold text-text-primary">{contracts.filter((c: any) => c.status === 'active').length}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Monthly Revenue</p>
                  <p className="text-lg font-semibold text-emerald-600">{monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '--'}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[11px] text-text-muted font-medium">Annual Revenue</p>
                  <p className="text-lg font-semibold text-text-primary">{monthlyRevenue > 0 ? formatCurrency(monthlyRevenue * 12) : '--'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mortgages Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-accent-600" />
              <h3 className="font-semibold text-sm text-text-primary">Mortgages ({mortgages.length})</h3>
            </div>
            <button
              onClick={() => setShowMortgageForm(true)}
              className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Mortgage
            </button>
          </div>

          {showMortgageForm && (
            <MortgageForm propertyId={Number(id)} onClose={() => setShowMortgageForm(false)} />
          )}

          {mortgages.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {mortgages.map((m) => <MortgageCard key={m.id} mortgage={m} />)}
            </div>
          ) : !showMortgageForm && (
            <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
              <Landmark className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No mortgages yet. Add one to track loan payments.</p>
            </div>
          )}

          {/* Valuation History Link */}
          {valuations.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-medium text-text-primary">Valuation History</span>
                <span className="text-xs text-text-muted">({valuations.length} records)</span>
              </div>
              <Link to={`/properties/${id}/valuation`} className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                View Full History
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ===== MAINTENANCE TAB ===== */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-accent-600" />
              <h3 className="font-semibold text-sm text-text-primary">Maintenance Requests</h3>
            </div>
            <Link
              to="/maintenance"
              className="text-xs text-accent-600 hover:text-accent-700 font-medium"
            >
              View All Maintenance
            </Link>
          </div>

          {maintenanceRequests.length > 0 ? (
            <div className="space-y-3">
              {maintenanceRequests.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-surface-border p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-text-primary">{req.title}</h4>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${maintenanceStatusColor(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[11px] font-medium capitalize ${priorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{req.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                      {req.unit_number && <span>Unit {req.unit_number}</span>}
                      <span>{req.category}</span>
                      <span>{formatDate(req.created_at)}</span>
                      {req.cost != null && <span>Cost: {formatCurrency(req.cost)}</span>}
                      {req.vendor_name && <span>Vendor: {req.vendor_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
              <Wrench className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No maintenance requests for this property</p>
              <Link to="/maintenance" className="text-xs text-accent-600 hover:text-accent-700 font-medium mt-2 inline-block">
                Go to Maintenance
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTS TAB ===== */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-surface-border p-8 text-center">
            <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="font-semibold text-sm text-text-primary mb-1">Document Management</h3>
            <p className="text-sm text-text-muted mb-4">Document management coming soon</p>
            <div className="border-2 border-dashed border-surface-border rounded-xl p-8 mx-auto max-w-md">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-text-muted" />
                <p className="text-xs text-text-muted">Drag and drop files here, or click to browse</p>
                <button
                  disabled
                  className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-surface text-text-muted cursor-not-allowed"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
