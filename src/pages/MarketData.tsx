import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarChart3, Search, TrendingUp, Building2, MapPin, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: number;
  transaction_id: string;
  area: string;
  building: string;
  property_type: string;
  rooms: string;
  actual_worth: number;
  meter_sale_price: number;
  area_sqm: number;
  transaction_date: string;
  reg_type: string;
}

interface AreaStat {
  area: string;
  transaction_count: number;
  avg_price_sqm: number;
  avg_price: number;
  earliest: string;
  latest: string;
}

interface TrendPoint {
  month: string;
  count: number;
  avg_price_sqm: number;
  avg_price: number;
  min_price: number;
  max_price: number;
}

interface AdrecSummary {
  total_transaction_value: number;
  total_transaction_value_change: number;
  residential_sales: number;
  residential_sales_change: number;
  foreign_investment_share: number;
  apartment_price_change: number;
  villa_price_change: number;
  apartment_rental_change: number;
  villa_rental_yield: number;
  total_residential_inventory: number;
  retail_occupancy: number;
  office_occupancy: number;
  cash_transactions_pct: number;
  year: number;
}

type Emirate = 'dubai' | 'abudhabi';

export default function MarketData() {
  const [emirate, setEmirate] = useState<Emirate>('dubai');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');

  const isDubai = emirate === 'dubai';
  const apiPrefix = isDubai ? '/market' : '/market/adrec';

  const { data: areas = [] } = useQuery<AreaStat[]>({
    queryKey: ['market-areas', emirate],
    queryFn: () => api.get(`${apiPrefix}/areas`),
  });

  const { data: txResult } = useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: ['market-transactions', emirate, areaFilter, buildingFilter],
    queryFn: () => api.get(`${apiPrefix}/transactions?area=${areaFilter}&building=${buildingFilter}&limit=25`),
  });

  const transactions = txResult?.transactions || [];

  const { data: trends = [] } = useQuery<TrendPoint[]>({
    queryKey: ['market-trends', emirate, selectedArea],
    queryFn: () => api.get(`${apiPrefix}/areas/${encodeURIComponent(selectedArea)}/trends`),
    enabled: !!selectedArea,
  });

  const { data: searchResults } = useQuery<{ areas: { area: string }[]; buildings: { building: string; area: string }[] }>({
    queryKey: ['market-search', emirate, searchQuery],
    queryFn: () => api.get(`${apiPrefix}/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  });

  const { data: adrecSummary } = useQuery<AdrecSummary>({
    queryKey: ['adrec-summary'],
    queryFn: () => api.get('/market/adrec/summary'),
    enabled: !isDubai,
  });

  const switchEmirate = (e: Emirate) => {
    setEmirate(e);
    setSelectedArea('');
    setSearchQuery('');
    setAreaFilter('');
    setBuildingFilter('');
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Emirate Tabs */}
      <div className="flex items-center gap-1 bg-surface-overlay p-1 rounded-lg w-fit">
        <button
          onClick={() => switchEmirate('dubai')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isDubai ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
        >
          Dubai (DLD)
        </button>
        <button
          onClick={() => switchEmirate('abudhabi')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isDubai ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
        >
          Abu Dhabi (ADREC)
        </button>
      </div>

      {/* ADREC Market Summary - Abu Dhabi Only */}
      {!isDubai && adrecSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Total Transactions ({adrecSummary.year})</p>
            <p className="text-lg font-bold text-text-primary">AED {Math.round(adrecSummary.total_transaction_value / 1e9)}B</p>
            <p className="text-xs text-success-600 flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" /> +{adrecSummary.total_transaction_value_change}% YoY</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Residential Sales</p>
            <p className="text-lg font-bold text-text-primary">AED {Math.round(adrecSummary.residential_sales / 1e9)}B</p>
            <p className="text-xs text-success-600 flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" /> +{adrecSummary.residential_sales_change}% YoY</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Apartment Prices</p>
            <p className="text-lg font-bold text-accent-600">+{adrecSummary.apartment_price_change}%</p>
            <p className="text-xs text-text-muted mt-1">Rental +{adrecSummary.apartment_rental_change}%</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Villa Prices</p>
            <p className="text-lg font-bold text-accent-600">+{adrecSummary.villa_price_change}%</p>
            <p className="text-xs text-text-muted mt-1">Rental yield +{adrecSummary.villa_rental_yield}%</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Foreign Investment</p>
            <p className="text-lg font-bold text-text-primary">{adrecSummary.foreign_investment_share}%</p>
            <p className="text-xs text-text-muted mt-1">of market growth</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Cash Transactions</p>
            <p className="text-lg font-bold text-text-primary">{adrecSummary.cash_transactions_pct}%</p>
            <p className="text-xs text-text-muted mt-1">of residential sales</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Retail Occupancy</p>
            <p className="text-lg font-bold text-success-600">{adrecSummary.retail_occupancy}%</p>
            <p className="text-xs text-text-muted mt-1">5-year peak</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-text-muted">Office Occupancy</p>
            <p className="text-lg font-bold text-success-600">{adrecSummary.office_occupancy}%+</p>
            <p className="text-xs text-text-muted mt-1">+11% lease prices</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
            placeholder={`Search ${isDubai ? 'Dubai' : 'Abu Dhabi'} areas, buildings...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-mercury-lg z-20 max-h-60 overflow-y-auto">
              {searchResults.areas.map(a => (
                <button key={a.area} onClick={() => { setSelectedArea(a.area); setAreaFilter(a.area); setSearchQuery(''); }} className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-surface text-sm text-left transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-accent-600" />
                  <span className="text-text-primary">{a.area}</span>
                  <span className="text-text-muted text-xs ml-auto">Area</span>
                </button>
              ))}
              {searchResults.buildings.map(b => (
                <button key={b.building + b.area} onClick={() => { setBuildingFilter(b.building); setAreaFilter(b.area); setSelectedArea(b.area); setSearchQuery(''); }} className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-surface text-sm text-left transition-colors">
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-text-primary">{b.building}</span>
                  <span className="text-text-muted text-xs ml-auto">{b.area}</span>
                </button>
              ))}
              {searchResults.areas.length === 0 && searchResults.buildings.length === 0 && (
                <p className="px-3.5 py-3 text-sm text-text-muted">No results found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Area Overview Cards */}
      <div>
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-3">
          {isDubai ? 'Dubai Areas' : 'Abu Dhabi Areas'}
        </h3>
        {areas.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-surface-border">
            <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No area data available. Check your market data settings.</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {areas.map((a, i) => (
            <button
              key={a.area}
              onClick={() => { setSelectedArea(a.area); setAreaFilter(a.area); setBuildingFilter(''); }}
              className={`text-left p-3.5 rounded-lg border transition-all animate-fade-in ${
                selectedArea === a.area
                  ? 'bg-accent-50 border-accent-200'
                  : 'bg-white border-surface-border hover:border-surface-border'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <p className="font-medium text-sm text-text-primary truncate">{a.area}</p>
              <p className="text-lg font-semibold text-accent-600 mt-1">AED {Math.round(a.avg_price_sqm).toLocaleString()}</p>
              <p className="text-xs text-text-muted">per sqm &middot; {a.transaction_count} txns</p>
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Area Trend Chart */}
      {selectedArea && trends.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent-600" />
            <h3 className="font-semibold text-sm text-text-primary">{selectedArea} — Price Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9de" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#83827d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#83827d' }} tickFormatter={v => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #dad9d4', backgroundColor: '#fff', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value: number, name: string) => [
                  `AED ${Math.round(value).toLocaleString()}`,
                  name === 'avg_price_sqm' ? 'Avg/sqm' : name === 'avg_price' ? 'Avg Price' : name
                ]}
              />
              <Line type="monotone" dataKey="avg_price_sqm" stroke="#c96442" strokeWidth={2} dot={false} name="avg_price_sqm" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-600" />
            <h3 className="font-semibold text-sm text-text-primary">
              Recent Transactions {areaFilter && `— ${areaFilter}`} {buildingFilter && `/ ${buildingFilter}`}
            </h3>
          </div>
          {(areaFilter || buildingFilter) && (
            <button onClick={() => { setAreaFilter(''); setBuildingFilter(''); setSelectedArea(''); }} className="text-xs text-accent-600 hover:text-accent-700 font-medium">
              Clear filters
            </button>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm">Select an area to view transactions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-surface-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Date</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Area</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Building</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Type</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Rooms</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Price</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">AED/sqm</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-text-muted">Area (sqm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface">
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className="hover:bg-surface transition-colors" style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                    <td className="px-4 py-2.5 text-text-muted">{formatDate(tx.transaction_date)}</td>
                    <td className="px-4 py-2.5 text-text-primary font-medium">{tx.area}</td>
                    <td className="px-4 py-2.5 text-text-muted">{tx.building}</td>
                    <td className="px-4 py-2.5 text-text-muted capitalize">{tx.property_type}</td>
                    <td className="px-4 py-2.5 text-text-muted">{tx.rooms}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-text-primary">{formatCurrency(tx.actual_worth)}</td>
                    <td className="px-4 py-2.5 text-right text-accent-600 font-medium">AED {Math.round(tx.meter_sale_price).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-text-muted">{tx.area_sqm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Source Attribution */}
      <p className="text-xs text-text-muted text-center">
        {isDubai ? 'Data source: Dubai Land Department (DLD)' : 'Data source: Abu Dhabi Real Estate Centre (ADREC) — adrec.gov.ae'}
      </p>
    </div>
  );
}
