'use client';

interface StrategyTemplate {
  name: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

const strategies: StrategyTemplate[] = [
  {
    name: 'Long Call',
    sentiment: 'BULLISH',
    description: 'The simplest strategy to realize a bullish outlook on the underlying instrument price.'
  },
  {
    name: 'Short Call',
    sentiment: 'BEARISH',
    description: 'Profit from a bearish outlook by selling call options.'
  },
  {
    name: 'Long Put',
    sentiment: 'BEARISH',
    description: 'Profit from declining stock prices with limited risk.'
  },
  {
    name: 'Short Put',
    sentiment: 'BULLISH',
    description: 'Generate income from selling put options on stocks you\'re willing to own.'
  },
  {
    name: 'Bull Call Spread',
    sentiment: 'BULLISH',
    description: 'Limited risk, limited reward strategy for moderately bullish outlook.'
  },
  {
    name: 'Bear Call Spread',
    sentiment: 'BEARISH',
    description: 'Profit from neutral to bearish price movement with defined risk.'
  },
  {
    name: 'Bear Put Spread',
    sentiment: 'BEARISH',
    description: 'Lower cost alternative to buying puts with limited upside.'
  },
  {
    name: 'Bull Put Spread',
    sentiment: 'BULLISH',
    description: 'Generate income from selling put spreads in bullish markets.'
  },
  {
    name: 'Long Straddle',
    sentiment: 'NEUTRAL',
    description: 'Profit from high volatility regardless of direction.'
  },
  {
    name: 'Short Straddle',
    sentiment: 'NEUTRAL',
    description: 'Profit from low volatility when price stays near strike.'
  }
];

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'BULLISH': return 'text-green-400 bg-green-400/10';
    case 'BEARISH': return 'text-red-400 bg-red-400/10';
    case 'NEUTRAL': return 'text-gray-400 bg-gray-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
};

interface StrategyTemplatesProps {
  onSelectStrategy: (strategy: StrategyTemplate) => void;
  selectedStrategy?: StrategyTemplate;
}

export default function StrategyTemplates({ onSelectStrategy, selectedStrategy }: StrategyTemplatesProps) {
  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Strategy templates</h2>
      </div>

      <div className="space-y-2">
        {strategies.map((strategy) => (
          <div
            key={strategy.name}
            className={`p-3 rounded cursor-pointer transition-colors ${
              selectedStrategy?.name === strategy.name
                ? 'bg-blue-600/20 border border-blue-500'
                : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
            }`}
            onClick={() => onSelectStrategy(strategy)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">{strategy.name}</h3>
              <span className={`px-2 py-1 text-xs rounded ${getSentimentColor(strategy.sentiment)}`}>
                {strategy.sentiment}
              </span>
            </div>
            <p className="text-sm text-gray-400">{strategy.description}</p>
            {selectedStrategy?.name === strategy.name && (
              <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Create strategy
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}