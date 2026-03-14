import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Protected pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Tenants = lazy(() => import('./pages/Tenants'));
const TenantDetail = lazy(() => import('./pages/TenantDetail'));
const Contracts = lazy(() => import('./pages/Contracts'));
const ContractDetail = lazy(() => import('./pages/ContractDetail'));
const Payments = lazy(() => import('./pages/Payments'));
const Deposits = lazy(() => import('./pages/Deposits'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PropertyValuation = lazy(() => import('./pages/PropertyValuation'));
const MortgageDetail = lazy(() => import('./pages/MortgageDetail'));
const CashFlow = lazy(() => import('./pages/CashFlow'));
const CalendarSettings = lazy(() => import('./pages/CalendarSettings'));
const MarketData = lazy(() => import('./pages/MarketData'));
const Expenses = lazy(() => import('./pages/Expenses'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Templates = lazy(() => import('./pages/Templates'));
const ReminderSettings = lazy(() => import('./pages/ReminderSettings'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const PropertyComparison = lazy(() => import('./pages/PropertyComparison'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
    <Toaster position="top-right" richColors closeButton duration={3000} />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <Layout><Properties /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute>
              <Layout><PropertyDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id/valuation"
          element={
            <ProtectedRoute>
              <Layout><PropertyValuation /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <ProtectedRoute>
              <Layout><Tenants /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/:id"
          element={
            <ProtectedRoute>
              <Layout><TenantDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <Layout><Contracts /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <Layout><ContractDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout><Payments /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/deposits"
          element={
            <ProtectedRoute>
              <Layout><Deposits /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <Layout><MarketData /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Layout><Portfolio /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mortgages/:id"
          element={
            <ProtectedRoute>
              <Layout><MortgageDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashflow"
          element={
            <ProtectedRoute>
              <Layout><CashFlow /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout><Expenses /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <Layout><Maintenance /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <Layout><PropertyComparison /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout><Templates /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute>
              <Layout><AuditLog /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/calendar"
          element={
            <ProtectedRoute>
              <Layout><CalendarSettings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/reminders"
          element={
            <ProtectedRoute>
              <Layout><ReminderSettings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-text-muted mb-2">404</h1>
              <p className="text-text-secondary mb-6">Page not found</p>
              <a href="/dashboard" className="text-accent-600 hover:text-accent-700 font-medium text-sm">Go to Dashboard</a>
            </div>
          </div>
        } />
      </Routes>
    </Suspense>
    </>
  );
}
