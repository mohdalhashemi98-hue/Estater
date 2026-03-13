import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrencyCompact } from '../../utils/formatters';

interface GainLossIndicatorProps {
  value: number;
  percent?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  invertColors?: boolean;
}

export default function GainLossIndicator({ value, percent, showIcon = true, size = 'md', invertColors = false }: GainLossIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const color = isNeutral
    ? (invertColors ? 'text-white/70' : 'text-text-muted')
    : isPositive
      ? (invertColors ? 'text-white' : 'text-emerald-600')
      : (invertColors ? 'text-white' : 'text-red-600');
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold',
  };
  const iconSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  const formatValue = (v: number) => formatCurrencyCompact(Math.abs(v));

  return (
    <span className={`inline-flex items-center gap-1 ${color} ${sizeClasses[size]}`}>
      {showIcon && !isNeutral && (
        isPositive ? <TrendingUp className={iconSize} /> : <TrendingDown className={iconSize} />
      )}
      {showIcon && isNeutral && <Minus className={iconSize} />}
      <span>
        {isPositive ? '+' : isNeutral ? '' : '-'}{formatValue(value)}
      </span>
      {percent !== undefined && (
        <span className="text-[0.85em] opacity-80">
          ({isPositive ? '+' : ''}{percent.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}
