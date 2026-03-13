import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Currency } from '../../types';

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function CurrencySelector({ value, onChange, className }: Props) {
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: () => api.get('/currencies'),
  });

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className || 'w-full border border-surface-border rounded-lg px-3 py-2 text-sm'}
    >
      {currencies.map(c => (
        <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
      ))}
    </select>
  );
}
