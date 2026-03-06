import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, FileText, Receipt, BarChart3, Bell, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useScrollReveal, useParallax } from '../hooks/useScrollReveal';

// --- Navbar ---
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm transition-all ${scrolled ? 'border-b border-stone-200 shadow-sm' : ''}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-stone-900 tracking-tight">Estater</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-stone-500">
          <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-stone-900 transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link to="/signup" className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// --- Dashboard Mockup ---
function DashboardMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-stone-200 rounded-md px-3 py-0.5 text-[9px] text-stone-400 w-48 text-center">
            Estater Dashboard
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-12 bg-stone-900 py-3 flex flex-col items-center gap-2.5 shrink-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded ${i === 0 ? 'bg-indigo-500' : 'bg-stone-700'}`} />
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 bg-stone-50 min-h-0">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Properties', value: '12', color: 'border-indigo-500' },
              { label: 'Occupied', value: '18', color: 'border-emerald-500' },
              { label: 'Revenue', value: 'AED 45K', color: 'border-blue-500' },
              { label: 'Overdue', value: '2', color: 'border-red-500' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-white rounded-md border border-stone-100 p-2 border-l-2 ${stat.color}`}>
                <p className="text-[7px] text-stone-400 uppercase tracking-wide">{stat.label}</p>
                <p className="text-[13px] font-bold text-stone-900 mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="bg-white rounded-md border border-stone-100 p-2 mb-3">
            <p className="text-[8px] text-stone-400 mb-1.5 font-medium">Revenue (6 months)</p>
            <svg viewBox="0 0 200 60" className="w-full h-auto">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[15, 30, 45].map(y => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#F3F4F6" strokeWidth="0.5" />
              ))}
              {/* Area fill */}
              <polygon points="0,50 30,40 60,35 90,25 120,30 150,18 180,15 200,20 200,60 0,60" fill="url(#chartGrad)" />
              {/* Line */}
              <polyline points="0,50 30,40 60,35 90,25 120,30 150,18 180,15 200,20" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Table preview */}
          <div className="bg-white rounded-md border border-stone-100 overflow-hidden">
            <div className="grid grid-cols-4 gap-1 px-2 py-1 bg-stone-50 border-b border-stone-100">
              {['Tenant', 'Unit', 'Amount', 'Status'].map(h => (
                <p key={h} className="text-[7px] text-stone-400 font-medium">{h}</p>
              ))}
            </div>
            {[
              { tenant: 'Ahmed R.', unit: 'A-101', amount: 'AED 8,500', status: 'Paid', dotColor: 'bg-emerald-400' },
              { tenant: 'Sarah K.', unit: 'B-204', amount: 'AED 6,200', status: 'Pending', dotColor: 'bg-amber-400' },
              { tenant: 'Omar M.', unit: 'C-301', amount: 'AED 9,000', status: 'Overdue', dotColor: 'bg-red-400' },
            ].map((row, i) => (
              <div key={row.tenant} className={`grid grid-cols-4 gap-1 px-2 py-1 ${i % 2 === 1 ? 'bg-stone-50/50' : ''}`}>
                <p className="text-[8px] text-stone-700">{row.tenant}</p>
                <p className="text-[8px] text-stone-500">{row.unit}</p>
                <p className="text-[8px] text-stone-700">{row.amount}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${row.dotColor}`} />
                  <p className="text-[7px] text-stone-500">{row.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AI Contract Mockup ---
function ContractMockup() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-stone-200 rounded-md px-3 py-0.5 text-[9px] text-stone-400 w-48 text-center">
            Contract Analysis
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="p-4 bg-stone-50 space-y-3">
        {/* AI card */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] font-semibold text-indigo-700">AI Analysis Complete</p>
            <p className="text-[8px] text-indigo-600 mt-0.5">3 key terms extracted, 2 obligations identified</p>
          </div>
        </div>

        {/* Extracted terms */}
        <div className="bg-white rounded-lg border border-stone-100 p-3">
          <p className="text-[8px] text-stone-400 font-medium mb-2">EXTRACTED TERMS</p>
          {[
            { label: 'Start Date', value: '1 Jan 2025' },
            { label: 'End Date', value: '31 Dec 2025' },
            { label: 'Monthly Rent', value: 'AED 8,500' },
          ].map(term => (
            <div key={term.label} className="flex justify-between py-1 border-b border-stone-50 last:border-0">
              <p className="text-[8px] text-stone-500">{term.label}</p>
              <p className="text-[8px] text-stone-800 font-medium">{term.value}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg border border-stone-100 p-3">
          <p className="text-[8px] text-stone-400 font-medium mb-1">SUMMARY</p>
          <p className="text-[8px] text-stone-600 leading-relaxed">
            12-month residential lease for Unit A-101 with automatic renewal clause. Tenant responsible for utilities and minor maintenance.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Payments Mockup ---
function PaymentsMockup() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-stone-200 rounded-md px-3 py-0.5 text-[9px] text-stone-400 w-48 text-center">
            Payment Tracking
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="p-3 bg-stone-50">
        <div className="bg-white rounded-lg border border-stone-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 gap-1 px-3 py-2 bg-stone-50 border-b border-stone-100">
            {['Tenant', 'Amount', 'Due Date', 'Status', ''].map(h => (
              <p key={h} className="text-[8px] text-stone-400 font-medium">{h}</p>
            ))}
          </div>
          {/* Rows */}
          {[
            { tenant: 'Ahmed R.', amount: 'AED 8,500', due: '1 Mar 2025', status: 'Paid', badge: 'bg-emerald-100 text-emerald-700' },
            { tenant: 'Sarah K.', amount: 'AED 6,200', due: '1 Mar 2025', status: 'Pending', badge: 'bg-amber-100 text-amber-700' },
            { tenant: 'Omar M.', amount: 'AED 9,000', due: '28 Feb 2025', status: 'Overdue', badge: 'bg-red-100 text-red-700' },
            { tenant: 'Fatima A.', amount: 'AED 7,800', due: '1 Mar 2025', status: 'Paid', badge: 'bg-emerald-100 text-emerald-700' },
            { tenant: 'Khalid B.', amount: 'AED 5,500', due: '5 Mar 2025', status: 'Pending', badge: 'bg-amber-100 text-amber-700' },
          ].map((row, i) => (
            <div key={row.tenant} className={`grid grid-cols-5 gap-1 px-3 py-1.5 items-center ${i % 2 === 1 ? 'bg-stone-50/50' : ''}`}>
              <p className="text-[9px] text-stone-700 font-medium">{row.tenant}</p>
              <p className="text-[9px] text-stone-700">{row.amount}</p>
              <p className="text-[9px] text-stone-500">{row.due}</p>
              <span className={`text-[7px] font-medium px-1.5 py-0.5 rounded-full w-fit ${row.badge}`}>{row.status}</span>
              <div />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Hero ---
function Hero() {
  const parallaxRef = useParallax<HTMLDivElement>(-0.08);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="hero-animate hero-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-tight">
          Manage your real estate portfolio with clarity.
        </h1>
        <p className="hero-animate hero-delay-2 mt-6 text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
          Track properties, tenants, contracts, and finances — all in one place.
          Built for landlords who value simplicity.
        </p>
        <div className="hero-animate hero-delay-3 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="bg-stone-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#features" className="text-stone-600 px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors">
            See features
          </a>
        </div>
      </div>
      {/* Dashboard mockup with parallax */}
      <div ref={parallaxRef} className="mt-16 w-full max-w-4xl mx-auto hero-mockup-animate">
        <DashboardMockup />
      </div>
    </section>
  );
}

// --- Features ---
const features = [
  { icon: Building2, title: 'Portfolio Management', desc: 'Track all your properties, units, and valuations in a single dashboard with real-time insights.' },
  { icon: Users, title: 'Tenant Lifecycle', desc: 'Manage tenants from onboarding to move-out with contracts, payments, and communication history.' },
  { icon: FileText, title: 'AI Contract Analysis', desc: 'Upload contracts and let AI extract key terms, obligations, and renewal dates automatically.' },
  { icon: Receipt, title: 'Expense Tracking', desc: 'Categorize expenses per property, track recurring costs, and monitor your net operating income.' },
  { icon: BarChart3, title: 'Financial Reports', desc: 'Generate income statements, cash flow reports, and export to PDF or Excel in seconds.' },
  { icon: Bell, title: 'Payment Reminders', desc: 'Automated reminders for upcoming and overdue payments so nothing slips through the cracks.' },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader title="Everything you need" subtitle="Powerful features that simplify property management from day one." />
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, delay }: { feature: typeof features[0]; delay: number }) {
  const ref = useScrollReveal<HTMLDivElement>({ delay, distance: 40 });
  return (
    <div ref={ref} className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <feature.icon className="w-6 h-6 text-stone-400 mb-4" />
      <h3 className="text-base font-semibold text-stone-900 mb-2">{feature.title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{feature.desc}</p>
    </div>
  );
}

// --- App Showcase ---
const showcaseItems = [
  {
    title: 'Your portfolio at a glance',
    description: 'See all properties, occupancy, and revenue in real time.',
    mockup: 'dashboard' as const,
    reverse: false,
  },
  {
    title: 'AI-powered contract analysis',
    description: 'Upload a PDF and let AI extract key dates, terms, and obligations.',
    mockup: 'contract' as const,
    reverse: true,
  },
  {
    title: 'Track every payment',
    description: 'Never miss a payment. Automated reminders keep you on track.',
    mockup: 'payments' as const,
    reverse: false,
  },
];

function AppShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader title="See it in action" subtitle="A closer look at the tools that keep your portfolio running smoothly." />
        <div className="mt-20 space-y-24">
          {showcaseItems.map((item, i) => (
            <ShowcaseItem key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseItem({ item, index }: { item: typeof showcaseItems[0]; index: number }) {
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
    <div className={`flex flex-col ${item.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
      <div ref={mockupRef} className="w-full md:w-3/5">
        {mockupEl}
      </div>
      <div ref={textRef} className="w-full md:w-2/5">
        <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{item.title}</h3>
        <p className="mt-3 text-stone-500 leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}

// --- How It Works ---
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Sign Up', desc: 'Create your account in seconds — no credit card required.' },
    { num: '2', title: 'Add Properties', desc: 'Enter your properties, units, and tenants in a simple form.' },
    { num: '3', title: 'Track Everything', desc: 'Monitor payments, expenses, and performance from your dashboard.' },
  ];

  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    el.style.transform = 'scaleX(0)';
    el.style.transformOrigin = 'left';
    el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s';

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
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader title="How it works" subtitle="Get started in three simple steps." />
        <div className="mt-16 grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div ref={lineRef} className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-stone-200" />
          {steps.map((s, i) => (
            <HowItWorksStep key={s.num} step={s} delay={i * 150} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksStep({ step, delay }: { step: { num: string; title: string; desc: string }; delay: number }) {
  const ref = useScrollReveal<HTMLDivElement>({ delay });
  return (
    <div ref={ref} className="text-center relative">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 relative z-10">
        <span className="text-lg font-bold text-stone-900">{step.num}</span>
      </div>
      <h3 className="text-base font-semibold text-stone-900 mb-2">{step.title}</h3>
      <p className="text-sm text-stone-500">{step.desc}</p>
    </div>
  );
}

// --- Stats ---
function Stats() {
  const stats = [
    { value: '6+', label: 'Currencies supported' },
    { value: 'Real-time', label: 'Dashboards' },
    { value: 'PDF & Excel', label: 'Exports' },
    { value: '100%', label: 'Private & secure' },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <StatItem key={s.label} stat={s} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}

function StatItem({ stat, delay }: { stat: { value: string; label: string }; delay: number }) {
  const ref = useScrollReveal<HTMLDivElement>({ delay });
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl sm:text-3xl font-bold text-stone-900">{stat.value}</p>
      <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
    </div>
  );
}

// --- FAQ ---
function FAQ() {
  const ref = useScrollReveal<HTMLDivElement>();
  const items = [
    { q: 'Is Estater free to use?', a: 'Yes — Estater is completely free to use for managing your personal property portfolio.' },
    { q: 'What types of properties are supported?', a: 'Villas, apartments, townhouses, penthouses, warehouses, offices, retail spaces, and more. We support 12+ UAE property typologies.' },
    { q: 'Can I track multiple currencies?', a: 'Absolutely. Estater supports AED, USD, EUR, GBP, SAR, INR, and more with configurable exchange rates.' },
    { q: 'Is my data private?', a: 'Your data stays on your own server. Estater is self-hosted, so you have full control over your information.' },
    { q: 'Does it support AI features?', a: 'Yes — you can upload contracts and Estater will use AI to extract key terms, obligations, milestones, and summaries automatically.' },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <SectionHeader title="Frequently asked questions" subtitle="Quick answers to common questions about Estater." />
        <div ref={ref} className="mt-12 space-y-0 divide-y divide-stone-200">
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
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium text-stone-900">{question}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm text-stone-500 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// --- CTA Banner ---
function CTABanner() {
  const ref = useScrollReveal<HTMLDivElement>({ variant: 'scale' });

  return (
    <section className="py-24 px-6">
      <div ref={ref} className="max-w-4xl mx-auto bg-stone-900 rounded-2xl p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to simplify your portfolio?</h2>
        <p className="mt-3 text-stone-400 text-sm">Join Estater and manage your properties with confidence.</p>
        <Link to="/signup" className="inline-block mt-8 bg-white text-stone-900 px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors">
          Get started for free
        </Link>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-stone-900">Estater</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-stone-400">
          <a href="#features" className="hover:text-stone-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-stone-600 transition-colors">How It Works</a>
          <Link to="/login" className="hover:text-stone-600 transition-colors">Sign In</Link>
        </div>
        <p className="text-xs text-stone-400">&copy; {new Date().getFullYear()} Estater. All rights reserved.</p>
      </div>
    </footer>
  );
}

// --- Helpers ---
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">{title}</h2>
      <p className="mt-3 text-stone-500 text-sm max-w-lg mx-auto">{subtitle}</p>
    </div>
  );
}

// --- Page ---
export default function Landing() {
  return (
    <div className="bg-stone-50 min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <AppShowcase />
      <HowItWorks />
      <Stats />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
