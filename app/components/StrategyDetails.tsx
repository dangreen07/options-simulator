'use client';

interface StrategyDetailsProps {
  underlyingPrice: number;
  maxProfit: number;
  maxLoss: number;
  winRate: number;
  breakeven: number;
  lotSize: number;
  delta: number;
  gamma: number;
  theta: number;
  daysToExpiration?: number;
}

export default function StrategyDetails({
  underlyingPrice = 173.72,
  maxProfit = Infinity,
  maxLoss = -454.99,
  winRate = 25.10,
  breakeven = 177.05,
  lotSize = 100,
  delta = 55.89,
  gamma = 3.69,
  theta: _theta = -17.2, // eslint-disable-line @typescript-eslint/no-unused-vars
  daysToExpiration = 30
}: StrategyDetailsProps) {
  const formatCurrency = (value: number) => {
    if (value === Infinity) return '∞';
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4 h-[9rem]">
      <div className="grid grid-cols-8 gap-6 text-sm">
        <div className="text-center">
          <div className="text-gray-400 mb-1">Underlying price</div>
          <div className="text-white font-medium">{formatCurrency(underlyingPrice)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Max profit
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-white font-medium">
            {maxProfit === Infinity ? '∞' : formatCurrency(maxProfit)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Max loss
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-red-400 font-medium">{formatCurrency(maxLoss)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Win rate
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-white font-medium">{formatPercent(winRate)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Breakeven
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-white font-medium">{formatCurrency(breakeven)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1">Lot size</div>
          <div className="text-white font-medium">{lotSize}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Delta
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-white font-medium">{delta.toFixed(2)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Gamma
            <span className="w-3 h-3 bg-gray-600 rounded-full text-xs flex items-center justify-center">?</span>
          </div>
          <div className="text-white font-medium">{gamma.toFixed(2)}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 mb-1">Days to Exp</div>
          <div className="text-white font-medium">{daysToExpiration}d</div>
        </div>
      </div>
    </div>
  );
}