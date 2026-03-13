import { formatCurrency } from '../../utils/formatters';
import GainLossIndicator from './GainLossIndicator';

interface StockTickerProps {
  label: string;
  currentValue: number;
  previousValue?: number;
  hoverValue?: number | null;
  hoverDate?: string | null;
}

export default function StockTicker({ label, currentValue, previousValue, hoverValue, hoverDate }: StockTickerProps) {
  const displayValue = hoverValue ?? currentValue;
  const baseValue = previousValue ?? currentValue;
  const gainLoss = displayValue - baseValue;
  const gainLossPercent = baseValue > 0 ? (gainLoss / baseValue) * 100 : 0;

  return (
    <div className="select-none">
      <p className="text-sm text-text-muted mb-1">{hoverDate || label}</p>
      <p className="text-4xl font-semibold text-text-primary tracking-tight transition-all duration-200">
        {formatCurrency(displayValue)}
      </p>
      {previousValue !== undefined && previousValue > 0 && (
        <div className="mt-1">
          <GainLossIndicator value={gainLoss} percent={gainLossPercent} size="md" />
          {hoverDate && (
            <span className="text-xs text-text-muted ml-2">vs. purchase price</span>
          )}
        </div>
      )}
    </div>
  );
}
