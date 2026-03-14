import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, Settings as SettingsIcon, Calendar, Bell, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

type Tab = 'profile' | 'preferences' | 'integrations';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR'] as const;
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [currency, setCurrency] = useState(() =>
    localStorage.getItem('estater_currency') || 'AED'
  );
  const [dateFormat, setDateFormat] = useState(() =>
    localStorage.getItem('estater_date_format') || 'DD/MM/YYYY'
  );

  useEffect(() => {
    localStorage.setItem('estater_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('estater_date_format', dateFormat);
  }, [dateFormat]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { key: 'preferences', label: 'Preferences', icon: <Globe className="w-4 h-4" /> },
    { key: 'integrations', label: 'Integrations', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  const inputClass =
    'w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-accent-500 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-accent-600" />
              Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <div className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-surface text-text-secondary">
                  {user?.name || '—'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <div className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-surface text-text-secondary">
                  {user?.email || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-accent-600" />
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-accent-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition-colors"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-accent-600" />
            Display Preferences
          </h2>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                Used as the default currency throughout the app
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className={inputClass}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                Controls how dates are displayed across the app
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <Link
            to="/settings/calendar"
            className="block bg-white rounded-xl border border-surface-border p-6 shadow-sm hover:border-accent/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-600 transition-colors">
                  Google Calendar
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Sync property viewings, deadlines, and reminders with your Google Calendar
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/settings/reminders"
            className="block bg-white rounded-xl border border-surface-border p-6 shadow-sm hover:border-accent/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-600 transition-colors">
                  Reminders
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Configure notification preferences for contract renewals, payments, and tasks
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
