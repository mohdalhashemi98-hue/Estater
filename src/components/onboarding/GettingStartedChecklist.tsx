import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

interface Props {
  summary: {
    total_properties: number;
    occupied_units: number;
    vacant_units: number;
    active_contracts: number;
  } | undefined;
}

type TenantsResponse = unknown[];

interface Step {
  label: string;
  complete: boolean;
  link?: string;
}

const DISMISSED_KEY = 'estater_checklist_dismissed';

export default function GettingStartedChecklist({ summary }: Props) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true',
  );

  const { data: tenantsData } = useQuery<TenantsResponse>({
    queryKey: ['tenants'],
    queryFn: () => api.get<TenantsResponse>('/tenants'),
    enabled: !dismissed && !!summary,
  });

  if (dismissed || !summary) return null;

  const tenantsCount = Array.isArray(tenantsData) ? tenantsData.length : 0;
  const totalUnits = summary.occupied_units + summary.vacant_units;

  const steps: Step[] = [
    { label: 'Create your account', complete: true },
    { label: 'Add your first property', complete: summary.total_properties > 0, link: '/properties' },
    { label: 'Add a unit to your property', complete: totalUnits > 0, link: '/properties' },
    { label: 'Add your first tenant', complete: tenantsCount > 0, link: '/tenants' },
    { label: 'Create your first contract', complete: summary.active_contracts > 0, link: '/contracts' },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const allComplete = completedCount === steps.length;

  if (allComplete) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-surface-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Getting Started</h2>
          <p className="text-sm text-text-muted">
            {completedCount}/{steps.length} complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-text-muted hover:bg-surface-overlay hover:text-text-secondary"
          aria-label="Dismiss checklist"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full rounded-full bg-surface-overlay">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface"
          >
            <div className="flex items-center gap-3">
              {step.complete ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-surface-border" />
              )}
              <span
                className={
                  step.complete
                    ? 'text-sm text-text-muted line-through'
                    : 'text-sm font-medium text-text-secondary'
                }
              >
                {step.label}
              </span>
            </div>

            {!step.complete && step.link && (
              <Link
                to={step.link}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-accent-600 hover:bg-accent-50"
              >
                Start
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
