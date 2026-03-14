import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardSummary, Contract, Payment, PortfolioSummary } from '../types';
import { formatCurrency, formatCurrencyCompact, formatCurrencyAxis, formatDate, daysUntil } from '../utils/formatters';
import {
  Building2, Users, FileText, AlertTriangle, TrendingUp,
  DollarSign, BarChart3, Plus, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GettingStartedChecklist from '../components/onboarding/GettingStartedChecklist';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import OccupancyTrendChart from '../components/dashboard/OccupancyTrendChart';
import CollectionRateCard from '../components/dashboard/CollectionRateCard';
import ExpenseBreakdownChart from '../components/dashboard/ExpenseBreakdownChart';
import NetIncomeChart from '../components/dashboard/NetIncomeChart';
import VacancyCostCard from '../components/dashboard/VacancyCostCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import PortfolioHealthScore from '../components/dashboard/PortfolioHealthScore';
import RentBenchmark from '../components/dashboard/RentBenchmark';
import FinancialProjections from '../components/dashboard/FinancialProjections';
import SmartInsights from '../components/dashboard/SmartInsights';
import RevenueCalendar from '../components/dashboard/RevenueCalendar';
import TenantRiskScoring from '../components/dashboard/TenantRiskScoring';
import MarketPulse from '../components/dashboard/MarketPulse';

interface AreaStat {
  area: string;
  transaction_count: number;
  avg_price_sqm: number;
  avg_price: number;
}

const PERIOD_OPTIONS = [
  { label: 'Last 3 Months', value: 3 },
  { label: 'Last 6 Months', value: 6 },
  { label: 'Last 12 Months', value: 12 },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart');
  const [revenuePeriod, setRevenuePeriod] = useState(6);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('estater_onboarding_complete');
  });
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('check');
  const [payRef, setPayRef] = useState('');
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary'),
  });

  const { data: expiring = [] } = useQuery<Contract[]>({
    queryKey: ['dashboard-expiring'],
    queryFn: () => api.get('/dashboard/expiring-contracts?days=60'),
  });

  const { data: upcoming = [] } = useQuery<Payment[]>({
    queryKey: ['dashboard-upcoming'],
    queryFn: () => api.get('/dashboard/upcoming-payments?days=30'),
  });

  const { data: overdue = [] } = useQuery<Payment[]>({
    queryKey: ['dashboard-overdue'],
    queryFn: () => api.get('/dashboard/overdue-payments'),
  });

  const { data: revenue = [] } = useQuery<{ month: string; total: number }[]>({
    queryKey: ['dashboard-revenue', revenuePeriod],
    queryFn: () => api.get(`/dashboard/revenue?months=${revenuePeriod}`),
  });

  const { data: portfolio } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/valuations/portfolio'),
  });

  const { data: marketAreas = [] } = useQuery<AreaStat[]>({
    queryKey: ['market-areas'],
    queryFn: () => api.get('/market/areas'),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: any }) =>
      api.post(`/payments/${paymentId}/mark-paid`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overdue'] });
      setPayingId(null);
      setPayRef('');
      toast.success('Payment marked as paid');
    },
    onError: () => toast.error('Failed to mark payment'),
  });

  const totalRevenue = revenue.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Page greeting */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary tracking-[-0.02em]">Welcome back</h1>
        <p className="text-sm text-text-muted mt-0.5">Here's what's happening with your portfolio.</p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 animate-fade-in animate-stagger-1">
        <Link to="/properties" className="pill-btn bg-accent-500 text-white hover:bg-accent-600 shadow-sm">
          <Building2 className="w-3.5 h-3.5" /> Properties
        </Link>
        <Link to="/contracts" className="pill-btn bg-white text-text-secondary border border-surface-border hover:bg-surface">
          <FileText className="w-3.5 h-3.5" /> Contracts
        </Link>
        <Link to="/payments" className="pill-btn bg-white text-text-secondary border border-surface-border hover:bg-surface">
          <DollarSign className="w-3.5 h-3.5" /> Payments
        </Link>
        <Link to="/tenants" className="pill-btn bg-white text-text-secondary border border-surface-border hover:bg-surface">
          <Users className="w-3.5 h-3.5" /> Tenants
        </Link>
        <Link to="/market" className="pill-btn bg-white text-text-secondary border border-surface-border hover:bg-surface">
          <BarChart3 className="w-3.5 h-3.5" /> Market
        </Link>
        <Link to="/portfolio" className="pill-btn text-text-muted hover:text-text-secondary ml-auto">
          <TrendingUp className="w-3.5 h-3.5" /> Portfolio
        </Link>
      </div>

      {/* Getting started checklist */}
      <GettingStartedChecklist summary={summary} />

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 animate-fade-in animate-stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-800">
              {overdue.length} Overdue Payment{overdue.length > 1 ? 's'  : ''} — {formatCurrency(summary?.overdue_amount ?? 0)}
            </span>
          </div>
          <div className="space-y-1.5">
            {overdue.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{p.tenant_name} — {p.property_name} ({p.unit_number})</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-800">{formatCurrency(p.amount)}</span>
                  {payingId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <select className="border border-surface-border rounded px-1.5 py-1 text-[11px] bg-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        <option value="check">Check</option>
                        <option value="bank_transfer">Transfer</option>
                        <option value="cash">Cash</option>
                      </select>
                      <input className="border border-surface-border rounded px-1.5 py-1 text-[11px] w-16 bg-white" placeholder="Ref#" value={payRef} onChange={e => setPayRef(e.target.value)} />
                      <button onClick={() => markPaidMutation.mutate({ paymentId: p.id, data: { payment_method: payMethod, reference: payRef } })} className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] hover:bg-emerald-700">OK</button>
                      <button onClick={() => setPayingId(null)} className="text-text-muted text-[11px]">X</button>
                    </div>
                  ) : (
                    <button onClick={() => setPayingId(p.id)} className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700">Pay</button>
                  )}
                </div>
              </div>
            ))}
            {overdue.length > 3 && (
              <Link to="/payments?status=overdue" className="text-sm text-red-600 hover:text-red-700 font-medium">
                View all {overdue.length} overdue
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main dashboard grid */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Portfolio balance chart — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">Portfolio value</h3>
              <svg className="w-4 h-4 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <button
                onClick={() => setChartView('chart')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${chartView === 'chart' ? 'bg-surface-overlay text-text-secondary' : 'hover:bg-surface text-text-muted'}`}
              >Chart</button>
              <button
                onClick={() => setChartView('table')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${chartView === 'table' ? 'bg-surface-overlay text-text-secondary' : 'hover:bg-surface text-text-muted'}`}
              >Table</button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-semibold text-text-primary tracking-[-0.02em] stat-value">
              {portfolio ? formatCurrency(portfolio.total_current_value) : 'AED 0.00'}
            </p>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="relative">
                <button
                  onClick={() => setPeriodOpen(!periodOpen)}
                  className="text-xs text-text-muted flex items-center gap-1 hover:text-text-secondary"
                >
                  {PERIOD_OPTIONS.find(p => p.value === revenuePeriod)?.label ?? `Last ${revenuePeriod} Months`}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {periodOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg border border-surface-border shadow-lg z-20 py-1 min-w-[140px]">
                      {PERIOD_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setRevenuePeriod(opt.value); setPeriodOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                            revenuePeriod === opt.value ? 'bg-accent-50 text-accent-700 font-medium' : 'text-text-secondary hover:bg-surface'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {portfolio && portfolio.total_gain_loss !== 0 && (
                <>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${portfolio.total_gain_loss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {portfolio.total_gain_loss >= 0 ? '↗' : '↘'} {formatCurrencyCompact(Math.abs(portfolio.total_gain_loss))}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Revenue chart / table */}
          {revenue.length > 0 ? (
            chartView === 'chart' ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenue} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c96442" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#c96442" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#83827d' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #dad9d4',
                      backgroundColor: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#c96442"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left py-2 text-xs font-medium text-text-secondary">Month</th>
                      <th className="text-right py-2 text-xs font-medium text-text-secondary">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map((r, i) => (
                      <tr key={r.month} className="border-b border-surface">
                        <td className="py-2 text-text-secondary">{r.month}</td>
                        <td className="py-2 text-right font-medium text-text-primary tabular-nums">{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
              Revenue data will appear here
            </div>
          )}
        </div>

        {/* Accounts / Properties list — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary">Properties</h3>
            <Link to="/properties" className="text-text-muted hover:text-text-secondary transition-colors" title="Add property">
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-0">
            {/* Stats as list items */}
            <div className="flex items-center justify-between py-2.5 border-b border-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-accent-500" />
                <span className="text-sm text-text-secondary">Total Properties</span>
              </div>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{summary?.total_properties ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-text-secondary">Occupied Units</span>
              </div>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{summary?.occupied_units ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-text-secondary">Vacant Units</span>
              </div>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{summary?.vacant_units ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-text-secondary">Active Contracts</span>
              </div>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{summary?.active_contracts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-text-secondary">Revenue (Month)</span>
              </div>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(summary?.revenue_this_month ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-text-secondary">Overdue</span>
              </div>
              <span className="text-sm font-semibold text-red-600 tabular-nums">{summary?.overdue_count ?? 0}</span>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="block mt-4 pt-3 border-t border-surface-border text-center text-xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
          >
            View portfolio details
          </Link>
        </div>
      </div>

      {/* Bottom three-column grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Expiring contracts */}
        <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary">Expiring Contracts</h3>
            <span className="text-[11px] text-text-muted font-medium">Next 60 days</span>
          </div>
          {expiring.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">No contracts expiring soon</p>
          ) : (
            <div className="space-y-2">
              {expiring.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/contracts/${c.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg row-hover group"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.tenant_name}</p>
                    <p className="text-xs text-text-muted">{c.property_name} — {c.unit_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-amber-600">{daysUntil(c.end_date)}d left</p>
                    <p className="text-[11px] text-text-muted">{formatDate(c.end_date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming payments */}
        <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary">Upcoming Payments</h3>
            <span className="text-[11px] text-text-muted font-medium">Next 30 days</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">No upcoming payments</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg row-hover">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.tenant_name}</p>
                    <p className="text-xs text-text-muted">{p.property_name} — {p.unit_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(p.amount)}</p>
                      <p className="text-[11px] text-text-muted">Due {formatDate(p.due_date)}</p>
                    </div>
                    {payingId === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <select className="border border-surface-border rounded px-1.5 py-1 text-[11px] bg-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                          <option value="check">Check</option>
                          <option value="bank_transfer">Transfer</option>
                          <option value="cash">Cash</option>
                        </select>
                        <input className="border border-surface-border rounded px-1.5 py-1 text-[11px] w-16 bg-white" placeholder="Ref#" value={payRef} onChange={e => setPayRef(e.target.value)} />
                        <button onClick={() => markPaidMutation.mutate({ paymentId: p.id, data: { payment_method: payMethod, reference: payRef } })} className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] hover:bg-emerald-700">OK</button>
                        <button onClick={() => setPayingId(null)} className="text-text-muted text-[11px]">X</button>
                      </div>
                    ) : (
                      <button onClick={() => setPayingId(p.id)} className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 whitespace-nowrap">Mark Paid</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market snapshot */}
        <div className="bg-white rounded-xl border border-surface-border p-5 animate-fade-in animate-stagger-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-primary">Market Snapshot</h3>
            <Link to="/market" className="text-[11px] text-accent-500 hover:text-accent-600 font-medium">View All</Link>
          </div>
          {marketAreas.length > 0 ? (
            <div className="space-y-2">
              {marketAreas.slice(0, 5).map((area) => (
                <div key={area.area} className="flex items-center justify-between p-2.5 rounded-lg row-hover">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{area.area}</p>
                    <p className="text-xs text-text-muted">{area.transaction_count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary tabular-nums">AED {area.avg_price_sqm.toLocaleString()}</p>
                    <p className="text-[11px] text-text-muted">per sqm</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BarChart3 className="w-6 h-6 text-text-muted mx-auto mb-1.5" />
              <p className="text-sm text-text-muted">No market data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Health score + Insights + Market pulse */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <PortfolioHealthScore />
        <SmartInsights />
        <MarketPulse />
      </div>

      {/* Rent benchmark + Tenant risk */}
      <div className="grid md:grid-cols-2 gap-5">
        <RentBenchmark />
        <TenantRiskScoring />
      </div>

      {/* Financial projections */}
      <FinancialProjections />

      {/* Analytics row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <CollectionRateCard />
        <ExpenseBreakdownChart />
        <VacancyCostCard />
      </div>

      {/* Revenue calendar + Activity feed */}
      <div className="grid md:grid-cols-2 gap-5">
        <RevenueCalendar />
        <ActivityFeed />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <OccupancyTrendChart />
        <NetIncomeChart />
      </div>

      {/* Floating footer disclaimer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="bg-text-primary text-surface text-[10px] px-4 py-2 rounded-full shadow-lg max-w-[500px] text-center leading-relaxed">
          Estater is a property management platform. Market data is sourced from DLD public records.
        </div>
      </div>

      <OnboardingWizard open={showOnboarding && summary?.total_properties === 0} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}
