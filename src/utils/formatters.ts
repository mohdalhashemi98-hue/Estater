export const CURRENCY_SYMBOL = 'AED';

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatCurrencyCompact(amount: number, currency: string = 'AED'): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  return `${currency} ${amount.toFixed(0)}`;
}

export function formatCurrencyAxis(value: number, currency?: string | number): string {
  // Handle case where Recharts passes index as second arg
  const cur = typeof currency === 'string' ? currency : 'AED';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cur} ${(value / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `${cur} ${(value / 1_000).toFixed(0)}k`;
  return `${cur} ${value}`;
}

export function categoryLabel(category: string): string {
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function frequencyLabel(freq: string): string {
  const labels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
  };
  return labels[freq] || freq;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAddress(property: { emirate: string; city?: string; neighborhood?: string; street?: string; villa_number?: string }): string {
  const parts: string[] = [];
  if (property.villa_number) parts.push(property.villa_number);
  if (property.street) parts.push(property.street);
  if (property.neighborhood) parts.push(property.neighborhood);
  if (property.city) parts.push(property.city);
  parts.push(property.emirate);
  return parts.join(', ');
}

export function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  return 'file';
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-surface-overlay text-text-muted',
    terminated: 'bg-red-50 text-red-700',
    renewed: 'bg-accent-50 text-accent-700',
    draft: 'bg-amber-50 text-amber-700',
    pending: 'bg-amber-50 text-amber-700',
    paid: 'bg-emerald-50 text-emerald-700',
    overdue: 'bg-red-50 text-red-700',
    cancelled: 'bg-surface-overlay text-text-muted',
    vacant: 'bg-emerald-50 text-emerald-700',
    occupied: 'bg-accent-50 text-accent-700',
    maintenance: 'bg-amber-50 text-amber-700',
    held: 'bg-accent-50 text-accent-700',
    refunded: 'bg-emerald-50 text-emerald-700',
    partially_refunded: 'bg-amber-50 text-amber-700',
    forfeited: 'bg-red-50 text-red-700',
  };
  return colors[status] || 'bg-surface-overlay text-text-muted';
}
