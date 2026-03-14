import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Property, Unit, Mortgage, PropertyValuation, PROPERTY_TYPE_GROUPS, UAE_EMIRATES } from '../types';
import { statusColor, formatCurrency, formatDate, formatAddress } from '../utils/formatters';
import { Plus, ArrowLeft, X, Bed, Bath, Ruler, Landmark, TrendingUp, BarChart3, Loader2, Home, Pencil, Trash2, Check, FileText } from 'lucide-react';
import MortgageForm from '../components/mortgage/MortgageForm';
import MortgageCard from '../components/mortgage/MortgageCard';
import ValuationChart from '../components/charts/ValuationChart';
import GainLossIndicator from '../components/ui/GainLossIndicator';
import PropertyMap from '../components/maps/PropertyMap';
import { toast } from 'sonner';

export default function PropertyDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
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

  return (
    <div className="space-y-6 max-w-[1000px]">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </Link>

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

      {/* Units Section */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-text-primary">Units ({property.units?.length || 0})</h3>
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {property.units?.map((unit: Unit, i: number) => (
          <div key={unit.id} className="bg-white rounded-xl border border-surface-border p-4 animate-fade-in" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
            {editingUnit === unit.id ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-text-primary text-sm">Edit Unit</h4>
                  <button onClick={() => setEditingUnit(null)} className="text-text-muted hover:text-text-secondary"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Unit #" value={editUnitForm.unit_number} onChange={e => setEditUnitForm({ ...editUnitForm, unit_number: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Floor" value={editUnitForm.floor} onChange={e => setEditUnitForm({ ...editUnitForm, floor: e.target.value })} />
                  <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Beds" value={editUnitForm.bedrooms} onChange={e => setEditUnitForm({ ...editUnitForm, bedrooms: e.target.value })} />
                  <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Baths" value={editUnitForm.bathrooms} onChange={e => setEditUnitForm({ ...editUnitForm, bathrooms: e.target.value })} />
                  <input type="number" className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none" placeholder="Area sqm" value={editUnitForm.area_sqm} onChange={e => setEditUnitForm({ ...editUnitForm, area_sqm: e.target.value })} />
                </div>
                <button onClick={() => updateUnitMutation.mutate({ unitId: unit.id, data: { ...editUnitForm, bedrooms: editUnitForm.bedrooms ? Number(editUnitForm.bedrooms) : null, bathrooms: editUnitForm.bathrooms ? Number(editUnitForm.bathrooms) : null, area_sqm: editUnitForm.area_sqm ? Number(editUnitForm.area_sqm) : null } })} disabled={!editUnitForm.unit_number} className="bg-accent-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors">Save</button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-text-primary">Unit {unit.unit_number}</h4>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(unit.status)}`}>{unit.status}</span>
                    <button onClick={() => { setEditingUnit(unit.id); setEditUnitForm({ unit_number: unit.unit_number, floor: unit.floor || '', bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : '', bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : '', area_sqm: unit.area_sqm != null ? String(unit.area_sqm) : '' }); }} className="p-1 text-text-muted hover:text-accent-600 rounded transition-colors"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => { if (confirm(`Delete unit ${unit.unit_number}?`)) deleteUnitMutation.mutate(unit.id); }} className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {unit.floor && <p className="text-xs text-text-muted mt-1">Floor: {unit.floor}</p>}
                <div className="flex gap-4 mt-3 text-xs text-text-muted">
                  {unit.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{unit.bedrooms} BR</span>}
                  {unit.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{unit.bathrooms} BA</span>}
                  {unit.area_sqm != null && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{unit.area_sqm} sqm</span>}
                </div>
                {unit.status === 'vacant' && (
                  <Link to="/contracts" className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
                    <FileText className="w-3 h-3" /> Create Contract
                  </Link>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {(!property.units || property.units.length === 0) && !showUnitForm && (
        <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
          <Home className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">No units yet. Add units to this property.</p>
        </div>
      )}
    </div>
  );
}
