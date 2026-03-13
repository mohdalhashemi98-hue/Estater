import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, FileText, Receipt, BarChart3, Bell, ChevronDown,
  ArrowRight, Sparkles, Shield, Globe, Zap, Clock, TrendingUp,
  CheckCircle2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { useScrollReveal, useParallax } from '../hooks/useScrollReveal';
import { InfiniteSlider } from '../components/ui/infinite-slider';
import { ProgressiveBlur } from '../components/ui/progressive-blur';

// ============================================================
// NAVBAR
// ============================================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-surface-border/60 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-text-primary tracking-tight">Estater</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-muted">
          <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
          <a href="#showcase" className="hover:text-text-primary transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a>
          <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link to="/signup" className="text-sm bg-accent-500 text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-colors shadow-sm">
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// DASHBOARD MOCKUP — Realistic app recreation
// ============================================================
function DashboardMockup({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-surface-border/80 shadow-xl overflow-hidden ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/80 border-b border-surface-border/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-surface-border/60 rounded-md px-3 py-0.5 text-[9px] text-text-muted w-44 text-center">
            app.estater.io/dashboard
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-11 bg-accent-500 py-3 flex flex-col items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded bg-accent-500" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded bg-text-secondary/60" />
          ))}
        </div>

        {/* Main content */}
        <div className={`flex-1 bg-surface/50 ${compact ? 'p-2' : 'p-3'}`}>
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {[
              { label: 'Properties', value: '12', color: 'border-l-accent-500', change: '+2' },
              { label: 'Occupied', value: '18', color: 'border-l-emerald-500', change: '94%' },
              { label: 'Revenue', value: 'AED 45K', color: 'border-l-blue-500', change: '+12%' },
              { label: 'Overdue', value: '2', color: 'border-l-red-500', change: '-1' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-white rounded-md border border-surface-border p-1.5 border-l-2 ${stat.color}`}>
                <p className="text-[6px] text-text-muted uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[11px] font-bold text-text-primary">{stat.value}</p>
                  <p className={`text-[6px] ${stat.change.startsWith('+') || stat.change.includes('%') ? 'text-emerald-500' : 'text-red-500'}`}>{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-md border border-surface-border p-2 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[7px] text-text-muted font-medium">Monthly Revenue</p>
              <div className="flex gap-1">
                {['6M', '1Y', 'All'].map(p => (
                  <span key={p} className={`text-[6px] px-1 py-0.5 rounded ${p === '6M' ? 'bg-accent-50 text-accent-600' : 'text-text-muted'}`}>{p}</span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 200 50" className="w-full h-auto">
              <defs>
                <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c96442" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#c96442" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[12, 25, 37].map(y => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#ede9de" strokeWidth="0.5" />
              ))}
              <polygon points="0,42 28,38 56,32 84,28 112,22 140,25 168,18 200,15 200,50 0,50" fill="url(#heroChartGrad)" />
              <polyline points="0,42 28,38 56,32 84,28 112,22 140,25 168,18 200,15" fill="none" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="168" cy="18" r="2" fill="#c96442" />
              <circle cx="168" cy="18" r="4" fill="#c96442" fillOpacity="0.15" />
            </svg>
          </div>

          {/* Table */}
          {!compact && (
            <div className="bg-white rounded-md border border-surface-border overflow-hidden">
              <div className="grid grid-cols-5 gap-1 px-2 py-1 bg-surface/80 border-b border-surface-border">
                {['Tenant', 'Property', 'Amount', 'Due', 'Status'].map(h => (
                  <p key={h} className="text-[6px] text-text-muted font-medium">{h}</p>
                ))}
              </div>
              {[
                { t: 'Ahmed R.', p: 'Marina Tower', a: 'AED 8,500', d: '1 Mar', s: 'Paid', c: 'bg-emerald-100 text-emerald-700' },
                { t: 'Sarah K.', p: 'JBR Walk', a: 'AED 6,200', d: '1 Mar', s: 'Pending', c: 'bg-amber-100 text-amber-700' },
                { t: 'Omar M.', p: 'Business Bay', a: 'AED 12,000', d: '28 Feb', s: 'Overdue', c: 'bg-red-100 text-red-700' },
              ].map((row, i) => (
                <div key={row.t} className={`grid grid-cols-5 gap-1 px-2 py-1 ${i % 2 === 1 ? 'bg-surface/30' : ''}`}>
                  <p className="text-[7px] text-text-secondary font-medium">{row.t}</p>
                  <p className="text-[7px] text-text-muted">{row.p}</p>
                  <p className="text-[7px] text-text-secondary">{row.a}</p>
                  <p className="text-[7px] text-text-muted">{row.d}</p>
                  <span className={`text-[5px] font-medium px-1 py-0.5 rounded-full w-fit ${row.c}`}>{row.s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AI CONTRACT MOCKUP
// ============================================================
function ContractMockup() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border/80 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/80 border-b border-surface-border/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-surface-border/60 rounded-md px-3 py-0.5 text-[9px] text-text-muted w-44 text-center">
            AI Contract Analysis
          </div>
        </div>
        <div className="w-12" />
      </div>
      <div className="p-3 bg-surface/50 space-y-2.5">
        <div className="bg-accent-50 border border-accent-100 rounded-lg p-2.5 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[8px] font-semibold text-accent-700">AI Analysis Complete</p>
            <p className="text-[7px] text-accent-600 mt-0.5">5 key terms extracted, 3 obligations, 2 milestones identified</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-surface-border p-2.5">
          <p className="text-[7px] text-text-muted font-medium mb-1.5 uppercase tracking-wider">Extracted Terms</p>
          {[
            { l: 'Tenant', v: 'Ahmed Al Rashid' },
            { l: 'Property', v: 'Marina Tower, Unit 1204' },
            { l: 'Monthly Rent', v: 'AED 8,500' },
            { l: 'Start Date', v: '1 Jan 2026' },
            { l: 'End Date', v: '31 Dec 2026' },
          ].map(t => (
            <div key={t.l} className="flex justify-between py-0.5 border-b border-surface last:border-0">
              <p className="text-[7px] text-text-muted">{t.l}</p>
              <p className="text-[7px] text-text-primary font-medium">{t.v}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button className="flex-1 bg-accent-500 text-white text-[7px] font-medium py-1.5 rounded-md text-center">
            Create Contract
          </button>
          <button className="flex-1 bg-white border border-surface-border text-text-secondary text-[7px] font-medium py-1.5 rounded-md text-center">
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENTS MOCKUP
// ============================================================
function PaymentsMockup() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border/80 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/80 border-b border-surface-border/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-surface-border/60 rounded-md px-3 py-0.5 text-[9px] text-text-muted w-44 text-center">
            Payment Tracking
          </div>
        </div>
        <div className="w-12" />
      </div>
      <div className="p-3 bg-surface/50">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {[
            { label: 'Collected', value: 'AED 240K', sub: 'This month', color: 'text-emerald-600' },
            { label: 'Pending', value: 'AED 48K', sub: '6 payments', color: 'text-amber-600' },
            { label: 'Overdue', value: 'AED 12K', sub: '2 payments', color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-md border border-surface-border p-1.5 text-center">
              <p className="text-[6px] text-text-muted uppercase">{s.label}</p>
              <p className={`text-[10px] font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[5px] text-text-muted">{s.sub}</p>
            </div>
          ))}
        </div>
        {/* Payment rows */}
        <div className="bg-white rounded-md border border-surface-border overflow-hidden">
          <div className="grid grid-cols-5 gap-1 px-2 py-1 bg-surface/80 border-b border-surface-border">
            {['Tenant', 'Amount', 'Due Date', 'Status', ''].map(h => (
              <p key={h} className="text-[6px] text-text-muted font-medium">{h}</p>
            ))}
          </div>
          {[
            { t: 'Ahmed R.', a: 'AED 8,500', d: '1 Mar 2026', s: 'Paid', c: 'bg-emerald-100 text-emerald-700' },
            { t: 'Sarah K.', a: 'AED 6,200', d: '1 Mar 2026', s: 'Pending', c: 'bg-amber-100 text-amber-700' },
            { t: 'Omar M.', a: 'AED 9,000', d: '28 Feb 2026', s: 'Overdue', c: 'bg-red-100 text-red-700' },
            { t: 'Fatima A.', a: 'AED 7,800', d: '1 Mar 2026', s: 'Paid', c: 'bg-emerald-100 text-emerald-700' },
            { t: 'Khalid B.', a: 'AED 5,500', d: '5 Mar 2026', s: 'Pending', c: 'bg-amber-100 text-amber-700' },
          ].map((r, i) => (
            <div key={r.t} className={`grid grid-cols-5 gap-1 px-2 py-1 items-center ${i % 2 === 1 ? 'bg-surface/30' : ''}`}>
              <p className="text-[7px] text-text-secondary font-medium">{r.t}</p>
              <p className="text-[7px] text-text-secondary">{r.a}</p>
              <p className="text-[7px] text-text-muted">{r.d}</p>
              <span className={`text-[5px] font-medium px-1 py-0.5 rounded-full w-fit ${r.c}`}>{r.s}</span>
              <div />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INTEGRATION ICONS for slider
// ============================================================
const integrationIcons = [
  { name: 'Claude AI', icon: Sparkles, color: 'text-violet-500' },
  { name: 'Google Calendar', icon: Globe, color: 'text-blue-500' },
  { name: 'n8n / Webhooks', icon: Zap, color: 'text-amber-500' },
  { name: 'Dubai DLD', icon: TrendingUp, color: 'text-emerald-500' },
  { name: 'PDF & Excel', icon: FileText, color: 'text-rose-500' },
  { name: 'HMAC Auth', icon: Shield, color: 'text-accent-500' },
];

// ============================================================
// HERO
// ============================================================
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-6 landing-gradient-hero overflow-hidden">
      {/* Ambient background mockup — very large, low opacity, blurred */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[1400px] max-w-none opacity-[0.06] blur-sm">
          <DashboardMockup compact />
        </div>
      </div>

      {/* Subtle background orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Trust badge */}
        <div className="hero-badge-animate inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-surface-border/60 shadow-sm mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-text-muted">Built for UAE landlords and property managers</span>
        </div>

        <h1 className="hero-animate hero-delay-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary tracking-tight leading-[1.1]">
          Your Entire Portfolio.{' '}
          <span className="bg-gradient-to-r from-accent-500 to-accent-300 bg-clip-text text-transparent">One Dashboard.</span>
        </h1>

        <p className="hero-animate hero-delay-2 mt-6 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          Track rents, manage tenants, analyze contracts with AI, and monitor cash flow across every property you own — from a single, intelligent platform.
        </p>

        <div className="hero-animate hero-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="bg-accent-500 text-white px-7 py-3.5 rounded-xl text-sm font-medium hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20 flex items-center gap-2 hover:shadow-xl hover:shadow-accent-500/25">
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#showcase" className="text-text-secondary px-7 py-3.5 rounded-xl text-sm font-medium hover:bg-white/60 transition-all border border-surface-border/60">
            See it in action
          </a>
        </div>

        <p className="hero-animate hero-delay-4 mt-4 text-xs text-text-muted">
          No credit card required. Setup in under 2 minutes.
        </p>
      </div>

      {/* Compact dashboard mockup below copy */}
      <div className="mt-16 w-full max-w-5xl mx-auto hero-mockup-animate relative z-10">
        <div className="hero-glow rounded-2xl">
          <DashboardMockup compact />
        </div>
      </div>

      {/* InfiniteSlider with integration logos */}
      <div className="hero-animate hero-delay-4 mt-12 w-full max-w-4xl mx-auto relative z-10">
        <p className="text-center text-xs text-text-muted mb-4">Integrates with your workflow</p>
        <div className="relative">
          <ProgressiveBlur direction="left" />
          <ProgressiveBlur direction="right" />
          <InfiniteSlider gap={32} speed={30} speedOnHover={15}>
            {integrationIcons.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 border border-surface-border/40 shrink-0"
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs font-medium text-text-secondary whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TRUST BAR — Social proof metrics
// ============================================================
function TrustBar() {
  const ref = useScrollReveal<HTMLDivElement>({ variant: 'fade', duration: 0.5 });
  return (
    <section className="py-12 px-6 border-y border-surface-border/60 bg-white">
      <div ref={ref} className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {[
          { value: '12+', label: 'Property Types' },
          { value: '7', label: 'Currencies' },
          { value: 'AI', label: 'Contract Analysis' },
          { value: '100%', label: 'Private & Secure' },
          { value: 'Real-time', label: 'DLD Market Data' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-lg font-bold text-text-primary">{s.value}</span>
            <span className="text-xs text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// PROBLEM AGITATION — "Managing properties shouldn't feel like this"
// ============================================================
function ProblemSection() {
  const headerRef = useScrollReveal<HTMLDivElement>();

  const problems = [
    {
      icon: FileSpreadsheet,
      title: 'Scattered across spreadsheets',
      desc: 'Property data in Excel, payments in WhatsApp, contracts in filing cabinets. Nothing connects.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      icon: AlertTriangle,
      title: 'Missed payments & deadlines',
      desc: 'Overdue rent goes unnoticed. Contracts expire without renewal. Money slips through the cracks.',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      icon: Clock,
      title: 'Hours of admin work',
      desc: 'Manually entering contract terms, calculating schedules, generating reports. Time you could spend growing.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-accent-600 mb-3">The problem</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Managing properties in the UAE shouldn't feel like this
          </h2>
          <p className="mt-3 text-text-muted text-sm">
            If any of this sounds familiar, you're not alone. 40% of UAE property managers cite outdated strategies as their primary challenge.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => {
            const ref = useScrollReveal<HTMLDivElement>({ delay: i * 120, distance: 30 });
            return (
              <div key={p.title} ref={ref} className="bg-white rounded-xl border border-surface-border/60 p-6 hover:shadow-md transition-all duration-200">
                <div className={`w-10 h-10 rounded-lg ${p.bgColor} flex items-center justify-center mb-4`}>
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{p.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES — Core capabilities
// ============================================================
const features = [
  { icon: Building2, title: 'Portfolio Management', desc: 'Track properties, units, and valuations across Dubai, Abu Dhabi, and all emirates in a single dashboard.', color: 'text-accent-500', bgColor: 'bg-accent-50' },
  { icon: Users, title: 'Tenant Lifecycle', desc: 'From onboarding to move-out — manage tenants, contracts, deposits, and full communication history.', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { icon: Sparkles, title: 'AI Contract Analysis', desc: 'Upload a PDF and let AI extract tenant details, rent terms, obligations, and key dates in seconds.', color: 'text-violet-500', bgColor: 'bg-violet-50' },
  { icon: Receipt, title: 'Expense Tracking', desc: 'Categorize costs per property, track recurring expenses, and know your true net operating income.', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { icon: BarChart3, title: 'Financial Reports', desc: 'Generate income statements, cash flow reports, and export to PDF or Excel with one click.', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { icon: Bell, title: 'Smart Reminders', desc: 'Automated alerts for upcoming payments, contract expirations, and overdue rent — so nothing slips through.', color: 'text-rose-500', bgColor: 'bg-rose-50' },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Features"
          title="Everything you need to manage your portfolio"
          subtitle="Powerful tools that replace spreadsheets, WhatsApp, and paper — from day one."
        />
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, delay }: { feature: typeof features[0]; delay: number }) {
  const ref = useScrollReveal<HTMLDivElement>({ delay, distance: 30 });
  return (
    <div ref={ref} className="group bg-surface/50 rounded-xl border border-surface-border/60 p-6 hover:bg-white hover:shadow-lg hover:border-surface-border hover:-translate-y-1 transition-all duration-300">
      <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className={`w-5 h-5 ${feature.color}`} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
    </div>
  );
}

// ============================================================
// APP SHOWCASE — Product deep-dives with mockups
// ============================================================
const showcaseItems = [
  {
    badge: 'Portfolio Dashboard',
    title: 'Your portfolio at a glance',
    description: 'See all properties, occupancy rates, revenue trends, and overdue payments in real time. Every metric you need to make informed decisions — in one view.',
    bullets: ['Real-time occupancy & revenue tracking', 'Multi-property, multi-unit management', 'Interactive charts with period filters'],
    mockup: 'dashboard' as const,
    reverse: false,
  },
  {
    badge: 'AI-Powered',
    title: 'Contracts analyzed in seconds, not hours',
    description: 'Upload any contract PDF. Our AI extracts tenant details, rent terms, obligations, milestones, and key dates — then creates the contract, tenant, and payment schedule in one click.',
    bullets: ['Supports PDF, images, and scanned documents', 'One-click contract + payment schedule creation', 'Editable before confirming — you stay in control'],
    mockup: 'contract' as const,
    reverse: true,
  },
  {
    badge: 'Payment Tracking',
    title: 'Never miss a payment again',
    description: 'Every payment tracked, every status visible. Automated overdue detection, collection rate analytics, and smart reminders keep your cash flow healthy.',
    bullets: ['Automatic overdue payment detection', 'Collection rate & vacancy cost analytics', 'Configurable reminders via email or webhook'],
    mockup: 'payments' as const,
    reverse: false,
  },
];

function AppShowcase() {
  return (
    <section id="showcase" className="py-24 px-6 landing-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Product"
          title="See it in action"
          subtitle="A closer look at the tools that keep your portfolio running smoothly."
        />
        <div className="mt-20 space-y-32">
          {showcaseItems.map((item, i) => (
            <ShowcaseItem key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseItem({ item }: { item: typeof showcaseItems[0]; index: number }) {
  const mockupRef = useScrollReveal<HTMLDivElement>({ variant: 'scale', duration: 0.8 });
  const textRef = useScrollReveal<HTMLDivElement>({ variant: 'fade-up', delay: 150 });

  const mockupEl = item.mockup === 'dashboard' ? (
    <DashboardMockup />
  ) : item.mockup === 'contract' ? (
    <ContractMockup />
  ) : (
    <PaymentsMockup />
  );

  return (
    <div className={`flex flex-col ${item.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-16`}>
      <div ref={mockupRef} className="w-full md:w-3/5">
        {mockupEl}
      </div>
      <div ref={textRef} className="w-full md:w-2/5">
        <span className="inline-block text-xs font-medium text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full mb-4">
          {item.badge}
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">{item.title}</h3>
        <p className="mt-3 text-text-muted leading-relaxed text-sm">{item.description}</p>
        <ul className="mt-5 space-y-2.5">
          {item.bullets.map(b => (
            <li key={b} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm text-text-secondary">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// UAE-SPECIFIC VALUE PROPS
// ============================================================
function UAESection() {
  const headerRef = useScrollReveal<HTMLDivElement>();

  const props = [
    { icon: Globe, title: 'All 7 Emirates', desc: 'Dubai, Abu Dhabi, Sharjah, and beyond — manage properties across every emirate.' },
    { icon: Receipt, title: 'AED-Native', desc: 'Built around AED with support for USD, EUR, GBP, SAR, and INR exchange rates.' },
    { icon: TrendingUp, title: 'DLD Market Data', desc: 'Real Dubai Land Department transaction data to benchmark your property values.' },
    { icon: Shield, title: 'Self-Hosted & Private', desc: 'Your data stays on your server. Full control, full privacy, full compliance.' },
  ];

  return (
    <section className="py-24 px-6 bg-accent-500 text-white">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-accent-400 mb-3">Built for the UAE</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Not another generic tool — built for your market
          </h2>
          <p className="mt-3 text-text-muted text-sm">
            Estater is designed from the ground up for UAE property investors, with local data, local currencies, and local compliance.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {props.map((p, i) => {
            const ref = useScrollReveal<HTMLDivElement>({ delay: i * 100 });
            return (
              <div key={p.title} ref={ref} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors duration-200">
                <p.icon className="w-6 h-6 text-accent-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1.5">{p.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// INTEGRATIONS — What connects
// ============================================================
function Integrations() {
  const ref = useScrollReveal<HTMLDivElement>();
  const integrations = [
    { icon: Sparkles, name: 'Claude AI', desc: 'Contract analysis' },
    { icon: Globe, name: 'Google Calendar', desc: 'Deadline sync' },
    { icon: Zap, name: 'n8n / Webhooks', desc: 'Automation' },
    { icon: TrendingUp, name: 'Dubai DLD', desc: 'Market data' },
    { icon: FileText, name: 'PDF & Excel', desc: 'Report exports' },
    { icon: Shield, name: 'HMAC Auth', desc: 'Secure webhooks' },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Integrations"
          title="Connects to your workflow"
          subtitle="Automate with n8n, sync to Google Calendar, pull live market data, and export professional reports."
        />
        <div ref={ref} className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((item, i) => {
            const cardRef = useScrollReveal<HTMLDivElement>({ delay: i * 80, variant: 'fade-up', distance: 20 });
            return (
              <div key={item.name} ref={cardRef} className="flex flex-col items-center text-center p-4 rounded-xl bg-surface/50 border border-surface-border/60 hover:border-accent-200 hover:bg-accent-50/30 transition-all duration-200">
                <item.icon className="w-6 h-6 text-text-muted mb-2.5" />
                <p className="text-xs font-semibold text-text-primary">{item.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS
// ============================================================
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Create your account', desc: 'Sign up in seconds — no credit card, no commitment. You\'re in.', icon: Zap },
    { num: '2', title: 'Add your properties', desc: 'Enter properties and units, or upload contracts and let AI do the work.', icon: Building2 },
    { num: '3', title: 'Track everything', desc: 'Payments, expenses, contracts, and performance — all from your dashboard.', icon: BarChart3 },
  ];

  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    el.style.transform = 'scaleX(0)';
    el.style.transformOrigin = 'left';
    el.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transform = 'scaleX(1)';
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-24 px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Getting started"
          title="Up and running in minutes"
          subtitle="Three steps. No technical setup. No credit card."
        />
        <div className="mt-16 grid md:grid-cols-3 gap-8 relative">
          <div ref={lineRef} className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-accent-200" />
          {steps.map((s, i) => {
            const ref = useScrollReveal<HTMLDivElement>({ delay: i * 150, distance: 24 });
            return (
              <div key={s.num} ref={ref} className="text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-white border border-surface-border/60 shadow-sm flex items-center justify-center mx-auto mb-5 relative z-10">
                  <s.icon className="w-7 h-7 text-accent-500" />
                </div>
                <span className="inline-block text-[10px] font-bold text-accent-500 bg-accent-50 px-2 py-0.5 rounded-full mb-2">
                  Step {s.num}
                </span>
                <h3 className="text-base font-semibold text-text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-text-muted max-w-xs mx-auto">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STATS — Key numbers
// ============================================================
function Stats() {
  const stats = [
    { value: '14+', label: 'Property types supported', desc: 'Villa to warehouse' },
    { value: '7', label: 'Currencies', desc: 'AED, USD, EUR & more' },
    { value: '<2 min', label: 'AI analysis time', desc: 'Per contract' },
    { value: '100%', label: 'Self-hosted', desc: 'Your data, your server' },
  ];

  return (
    <section className="py-20 px-6 bg-white border-y border-surface-border/60">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => {
          const ref = useScrollReveal<HTMLDivElement>({ delay: i * 100 });
          return (
            <div ref={ref} key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-text-primary">{s.value}</p>
              <p className="mt-1.5 text-sm font-medium text-text-secondary">{s.label}</p>
              <p className="text-xs text-text-muted">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const items = [
    { q: 'Is Estater free to use?', a: 'Yes — Estater is completely free to use for managing your personal property portfolio. No hidden fees, no feature gates.' },
    { q: 'What types of properties are supported?', a: 'Villas, apartments, townhouses, penthouses, studios, duplexes, warehouses, offices, retail spaces, and more. We support 14+ UAE property typologies.' },
    { q: 'Can I track multiple currencies?', a: 'Absolutely. Estater supports AED, USD, EUR, GBP, SAR, INR, JPY, and more with configurable exchange rates.' },
    { q: 'Is my data private?', a: 'Your data stays on your own server. Estater is self-hosted, so you have full control over your information. No third-party access, ever.' },
    { q: 'Does it support AI features?', a: 'Yes — upload contracts and Estater will use Claude AI to extract key terms, obligations, milestones, and summaries automatically. Then create the contract with one click.' },
    { q: 'Can I integrate with other tools?', a: 'Yes. Estater supports webhooks for n8n, Zapier, or any automation platform. It also integrates with Google Calendar for deadline syncing.' },
    { q: 'How is this different from a spreadsheet?', a: 'Unlike spreadsheets, Estater auto-generates payment schedules, detects overdue payments, analyzes contracts with AI, provides real-time dashboards, and gives you a complete audit trail. All connected, all automatic.' },
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-surface">
      <div className="max-w-2xl mx-auto">
        <SectionHeader
          badge="FAQ"
          title="Frequently asked questions"
          subtitle="Everything you need to know about Estater."
        />
        <div className="mt-12 space-y-0 divide-y divide-surface-border/60">
          {items.map(item => (
            <FAQItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="text-sm font-medium text-text-primary group-hover:text-accent-600 transition-colors">{question}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ml-4 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 px-1 text-sm text-text-muted leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ============================================================
// CTA BANNER — Final conversion push
// ============================================================
function CTABanner() {
  const ref = useScrollReveal<HTMLDivElement>({ variant: 'scale' });
  return (
    <section className="py-24 px-6 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto bg-gradient-to-br from-text-primary to-text-secondary rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Your portfolio deserves better<br className="hidden sm:block" /> than a spreadsheet.
          </h2>
          <p className="mt-4 text-text-muted text-sm sm:text-base max-w-lg mx-auto">
            Join Estater and manage your properties with the clarity, automation, and intelligence you've been missing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="bg-accent-500 text-white px-7 py-3.5 rounded-xl text-sm font-medium hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20 flex items-center gap-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="text-text-muted px-7 py-3.5 rounded-xl text-sm font-medium hover:text-white transition-colors">
              Already have an account?
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-border/60 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Estater</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-text-muted">
            <a href="#features" className="hover:text-text-secondary transition-colors">Features</a>
            <a href="#showcase" className="hover:text-text-secondary transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-text-secondary transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-text-secondary transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-text-secondary transition-colors">Sign In</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Estater. All rights reserved.</p>
          <p className="text-xs text-text-muted">Built for UAE landlords and property managers.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// HELPERS
// ============================================================
function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="text-center max-w-2xl mx-auto">
      {badge && (
        <p className="text-sm font-medium text-accent-600 mb-3">{badge}</p>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{title}</h2>
      <p className="mt-3 text-text-muted text-sm">{subtitle}</p>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function Landing() {
  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <Hero />
      <TrustBar />
      <ProblemSection />
      <Features />
      <AppShowcase />
      <UAESection />
      <Integrations />
      <HowItWorks />
      <Stats />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
