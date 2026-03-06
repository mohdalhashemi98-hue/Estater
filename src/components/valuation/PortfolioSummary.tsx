import { PortfolioSummary as PortfolioSummaryType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import GainLossIndicator from '../ui/GainLossIndicator';
import { Building2, TrendingUp, DollarSign } from 'lucide-react';

interface PortfolioSummaryProps {
  data: PortfolioSummaryType;
}

export default function PortfolioSummary({ data }: PortfolioSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in animate-stagger-1">
        <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center mb-2.5">
          <Building2 className="w-4 h-4 text-accent-600" />
        </div>
        <p className="text-xs text-gray-500">Properties</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{data.total_properties}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in animate-stagger-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-2.5">
          <DollarSign className="w-4 h-4 text-gray-500" />
        </div>
        <p className="text-xs text-gray-500">Total Invested</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{formatCurrency(data.total_purchase_value)}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in animate-stagger-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-xs text-gray-500">Current Value</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{formatCurrency(data.total_current_value)}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in animate-stagger-4">
        <p className="text-xs text-gray-500 mb-2">Total Gain/Loss</p>
        <GainLossIndicator value={data.total_gain_loss} percent={data.gain_loss_percent} size="lg" />
      </div>
    </div>
  );
}
