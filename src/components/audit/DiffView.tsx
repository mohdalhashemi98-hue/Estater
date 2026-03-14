interface Props {
  oldValues: string | null;
  newValues: string | null;
}

export default function DiffView({ oldValues, newValues }: Props) {
  const oldObj = oldValues ? JSON.parse(oldValues) : null;
  const newObj = newValues ? JSON.parse(newValues) : null;

  if (!oldObj && !newObj) {
    return <p className="text-xs text-text-muted">No data captured</p>;
  }

  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  // Filter out noise fields
  const skipKeys = new Set(['created_at', 'updated_at', 'timestamp']);

  const changedKeys = Array.from(allKeys).filter(k => {
    if (skipKeys.has(k)) return false;
    const o = oldObj?.[k];
    const n = newObj?.[k];
    return String(o ?? '') !== String(n ?? '');
  });

  if (changedKeys.length === 0 && oldObj && newObj) {
    return <p className="text-xs text-text-muted">No visible changes</p>;
  }

  return (
    <div className="bg-surface rounded-lg border border-surface-border overflow-hidden">
      <div className="grid grid-cols-3 gap-0 text-xs">
        <div className="px-3 py-2 font-medium text-text-secondary bg-surface-overlay border-b border-surface-border">Field</div>
        <div className="px-3 py-2 font-medium text-text-secondary bg-surface-overlay border-b border-surface-border">Old Value</div>
        <div className="px-3 py-2 font-medium text-text-secondary bg-surface-overlay border-b border-surface-border">New Value</div>
        {changedKeys.map(key => {
          const oldVal = oldObj?.[key];
          const newVal = newObj?.[key];
          return (
            <div key={key} className="contents">
              <div className="px-3 py-1.5 text-text-secondary font-medium border-b border-surface-border">{key}</div>
              <div className="px-3 py-1.5 border-b border-surface-border">
                {oldVal !== undefined ? (
                  <span className="bg-red-50 text-red-700 px-1 rounded">{String(oldVal)}</span>
                ) : <span className="text-text-muted">-</span>}
              </div>
              <div className="px-3 py-1.5 border-b border-surface-border">
                {newVal !== undefined ? (
                  <span className="bg-emerald-50 text-emerald-700 px-1 rounded">{String(newVal)}</span>
                ) : <span className="text-text-muted">-</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
