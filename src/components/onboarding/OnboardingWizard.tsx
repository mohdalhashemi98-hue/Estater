import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CheckCircle2, Building2, Home, X } from 'lucide-react';

const ONBOARDING_KEY = 'estater_onboarding_complete';

const PROPERTY_TYPES = [
  'villa',
  'apartment',
  'townhouse',
  'penthouse',
  'studio',
  'commercial',
  'office',
] as const;

const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

interface PropertyPayload {
  name: string;
  type: string;
  emirate: string;
}

interface PropertyResponse {
  id: number;
  [key: string]: unknown;
}

interface UnitPayload {
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingWizard({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  // Property form state
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0] as string);
  const [emirate, setEmirate] = useState(EMIRATES[0] as string);

  // Created property id
  const [propertyId, setPropertyId] = useState<number | null>(null);

  // Unit form state
  const [unitNumber, setUnitNumber] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [unitsAdded, setUnitsAdded] = useState(0);

  const propertyMutation = useMutation({
    mutationFn: (data: PropertyPayload) =>
      api.post<PropertyResponse>('/properties', data),
    onSuccess: (res) => {
      setPropertyId(res.id);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setStep(2);
    },
  });

  const unitMutation = useMutation({
    mutationFn: (data: UnitPayload) =>
      api.post<unknown>(`/properties/${propertyId}/units`, data),
    onSuccess: () => {
      setUnitsAdded((c) => c + 1);
      setUnitNumber('');
      setBedrooms('');
      setBathrooms('');
      setAreaSqm('');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) return;
    propertyMutation.mutate({
      name: propertyName.trim(),
      type: propertyType,
      emirate,
    });
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;
    unitMutation.mutate({
      unit_number: unitNumber.trim(),
      bedrooms: bedrooms ? Number(bedrooms) : 0,
      bathrooms: bathrooms ? Number(bathrooms) : 0,
      area_sqm: areaSqm ? Number(areaSqm) : 0,
    });
  };

  const handleAddAnotherUnit = () => {
    // Just reset the form — user stays on step 2
    setUnitNumber('');
    setBedrooms('');
    setBathrooms('');
    setAreaSqm('');
  };

  if (!open) return null;

  const totalSteps = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:bg-surface-overlay hover:text-text-secondary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-accent-600'
                  : i < step
                    ? 'w-2 bg-accent-400'
                    : 'w-2 bg-surface-border'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
              <Building2 className="h-8 w-8 text-accent-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary">
              Welcome to Estater!
            </h2>
            <p className="mb-8 text-text-muted">
              Let&apos;s set up your first property in under 2 minutes.
            </p>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={handleSkip}
              className="mt-3 w-full py-2 text-sm text-text-muted hover:text-text-secondary"
            >
              Skip &mdash; I&apos;ll explore on my own
            </button>
          </div>
        )}

        {/* Step 1: Add Property */}
        {step === 1 && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
              <Building2 className="h-6 w-6 text-accent-600" />
            </div>
            <h2 className="mb-1 text-center text-xl font-bold text-text-primary">
              Add your first property
            </h2>
            <p className="mb-6 text-center text-sm text-text-muted">
              Enter the details of your property below.
            </p>

            <form onSubmit={handlePropertySubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Marina Tower"
                  required
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Emirate
                </label>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                >
                  {EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>

              {propertyMutation.isError && (
                <p className="text-sm text-red-600">
                  {propertyMutation.error?.message ?? 'Failed to create property.'}
                </p>
              )}

              <button
                type="submit"
                disabled={propertyMutation.isPending}
                className="w-full rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                {propertyMutation.isPending ? 'Creating...' : 'Create Property'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Add Unit */}
        {step === 2 && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
              <Home className="h-6 w-6 text-accent-600" />
            </div>
            <h2 className="mb-1 text-center text-xl font-bold text-text-primary">
              Add a unit
            </h2>
            <p className="mb-6 text-center text-sm text-text-muted">
              {unitsAdded > 0
                ? `${unitsAdded} unit${unitsAdded > 1 ? 's' : ''} added. Add another or continue.`
                : 'Add at least one unit to your property.'}
            </p>

            <form onSubmit={handleUnitSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Unit Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 101"
                  required
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Area (sqm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
              </div>

              {unitMutation.isError && (
                <p className="text-sm text-red-600">
                  {unitMutation.error?.message ?? 'Failed to add unit.'}
                </p>
              )}

              <button
                type="submit"
                disabled={unitMutation.isPending}
                className="w-full rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                {unitMutation.isPending ? 'Adding...' : 'Add Unit'}
              </button>
            </form>

            {unitsAdded > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={handleAddAnotherUnit}
                  className="text-sm font-medium text-accent-600 hover:text-accent-700"
                >
                  + Add another unit
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-surface-overlay px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-overlay transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary">
              You&apos;re all set!
            </h2>
            <p className="mb-8 text-text-muted">
              Your property is ready.
            </p>

            <button
              onClick={handleComplete}
              className="w-full rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              Go to Dashboard
            </button>

            <div className="mt-4 flex items-center justify-center gap-6">
              <Link
                to="/tenants"
                onClick={handleComplete}
                className="text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Add a tenant &rarr;
              </Link>
              <Link
                to="/contracts"
                onClick={handleComplete}
                className="text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Upload a contract &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
