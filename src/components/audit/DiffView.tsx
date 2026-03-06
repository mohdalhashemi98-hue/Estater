interface Props {
  oldValues: string | null;
  newValues: string | null;
}

export default function DiffView({ oldValues, newValues }: Props) {
  const oldObj = oldValues ? JSON.parse(oldValues) : null;
  const newObj = newValues ? JSON.parse(newValues) : null;

  if (!oldObj && !newObj) {
    return <p className="text-xs text-gray-400">No data captured</p>;
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
    return <p className="text-xs text-gray-400">No visible changes</p>;
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-3 gap-0 text-xs">
        <div className="px-3 py-2 font-medium text-gray-500 bg-gray-100 border-b border-gray-200">Field</div>
        <div className="px-3 py-2 font-medium text-gray-500 bg-gray-100 border-b border-gray-200">Old Value</div>
        <div className="px-3 py-2 font-medium text-gray-500 bg-gray-100 border-b border-gray-200">New Value</div>
        {changedKeys.map(key => {
          const oldVal = oldObj?.[key];
          const newVal = newObj?.[key];
          return (
            <div key={key} className="contents">
              <div className="px-3 py-1.5 text-gray-700 font-medium border-b border-gray-100">{key}</div>
              <div className="px-3 py-1.5 border-b border-gray-100">
                {oldVal !== undefined ? (
                  <span className="bg-red-50 text-red-700 px-1 rounded">{String(oldVal)}</span>
                ) : <span className="text-gray-300">-</span>}
              </div>
              <div className="px-3 py-1.5 border-b border-gray-100">
                {newVal !== undefined ? (
                  <span className="bg-emerald-50 text-emerald-700 px-1 rounded">{String(newVal)}</span>
                ) : <span className="text-gray-300">-</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
