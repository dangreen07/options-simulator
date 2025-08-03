'use client';

import { useState, useMemo, useEffect } from 'react';
import TopNavigation from './components/TopNavigation';
import StrategyTemplates from './components/StrategyTemplates';
import PayoffChart from './components/PayoffChart';
import StrategyControls from './components/StrategyControls';
import StrategyDetails from './components/StrategyDetails';
import { 
  generatePayoffData, 
  calculateStrategyStats,
  createLongCallStrategy,
  createBullCallSpreadStrategy,
  createLongPutStrategy,
  createShortCallStrategy,
  createShortPutStrategy,
  createBearCallSpreadStrategy,
  createLongStraddleStrategy,
  Strategy
} from './utils/optionCalculations';

interface StrategyTemplate {
  name: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('strategy');
  const [symbol, setSymbol] = useState('NVDA');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate>();
  const [underlyingPrice, setUnderlyingPrice] = useState<number>(0);
  const [strike, setStrike] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [size, setSize] = useState(1);
  const [selectedGreek, setSelectedGreek] = useState('Vega');
  const [expiration, setExpiration] = useState<number>();

  // Fetch underlying price when symbol changes
  useEffect(() => {
    if (!symbol) return;
    
    setLoadingPrice(true);
    // Use the options API to get current price from the quote data
    fetch(`/api/expirations/${symbol}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        // Try to get a sample option chain to extract underlying price
        const expirations = await res.json();
        if (Array.isArray(expirations) && expirations.length > 0) {
          // Fetch option chain for first expiration to get underlying price
          const chainRes = await fetch(`/api/options/${symbol}/${expirations[0]}`);
          if (chainRes.ok) {
            const chainData = await chainRes.json();
            if (chainData.underlyingPrice) {
              setUnderlyingPrice(chainData.underlyingPrice);
              // Reset strike to 0 so it gets auto-selected to closest
              setStrike(0);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch underlying price for', symbol, ':', err);
        // Fallback: try to extract from a known working symbol
        setUnderlyingPrice(100); // Temporary fallback
      })
      .finally(() => setLoadingPrice(false));
  }, [symbol]);

  // Calculate days to expiration
  const daysToExpiration = useMemo(() => {
    if (!expiration) return 30; // Default to 30 days
    const now = Date.now();
    const expirationDate = expiration * 1000; // Convert from Unix seconds to milliseconds
    const diffTime = Math.abs(expirationDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  }, [expiration]);

  // Create strategy based on selection and parameters
  const currentStrategy: Strategy | null = useMemo(() => {
    if (!selectedStrategy) return null;

    switch (selectedStrategy.name) {
      case 'Long Call':
        return createLongCallStrategy(strike, underlyingPrice, daysToExpiration);
      case 'Short Call':
        return createShortCallStrategy(strike, underlyingPrice, daysToExpiration);
      case 'Long Put':
        return createLongPutStrategy(strike, underlyingPrice, daysToExpiration);
      case 'Short Put':
        return createShortPutStrategy(strike, underlyingPrice, daysToExpiration);
      case 'Bull Call Spread':
        return createBullCallSpreadStrategy(strike, strike + 5, underlyingPrice, daysToExpiration);
      case 'Bear Call Spread':
        return createBearCallSpreadStrategy(strike, strike + 5, underlyingPrice, daysToExpiration);
      case 'Long Straddle':
        return createLongStraddleStrategy(strike, underlyingPrice, daysToExpiration);
      default:
        return createLongCallStrategy(strike, underlyingPrice, daysToExpiration); // Default fallback
    }
  }, [selectedStrategy, strike, size, underlyingPrice, daysToExpiration]);

  // Generate payoff data when strategy or parameters change
  const payoffData = useMemo(() => {
    if (!currentStrategy) {
      // Default empty strategy data
      return generatePayoffData({
        name: 'Empty Strategy',
        legs: []
      }, underlyingPrice);
    }
    
    return generatePayoffData(currentStrategy, underlyingPrice);
  }, [currentStrategy, underlyingPrice]);

  // Calculate strategy statistics
  const strategyStats = useMemo(() => {
    if (!currentStrategy) {
      return {
        maxProfit: 0,
        maxLoss: 0,
        breakeven: [],
        profitProbability: 0
      };
    }
    
    return calculateStrategyStats(currentStrategy, underlyingPrice);
  }, [currentStrategy, underlyingPrice]);

  const handleExpirationChange = (exp: number) => {
    setExpiration(exp);
  };

  const handleStrikeChange = (newStrike: number) => {
    setStrike(newStrike);
  };

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
  };

  const handleGreekChange = (greek: string) => {
    setSelectedGreek(greek);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TopNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        symbol={symbol}
        onSymbolChange={setSymbol}
      />
      
      <StrategyControls
        symbol={symbol}
        onExpirationChange={handleExpirationChange}
        onStrikeChange={handleStrikeChange}
        onSizeChange={handleSizeChange}
        onGreekChange={handleGreekChange}
        selectedGreek={selectedGreek}
        strike={strike}
        size={size}
        underlyingPrice={underlyingPrice}
      />

      <div className="flex h-[calc(100vh-9rem)]">
        <StrategyTemplates 
          onSelectStrategy={setSelectedStrategy}
          selectedStrategy={selectedStrategy}
        />
        
        <div className="flex-1 flex flex-col">
          <PayoffChart 
            underlyingPrice={underlyingPrice}
            data={payoffData}
            selectedGreek={selectedGreek}
            breakevens={strategyStats.breakeven}
          />
          
          <StrategyDetails
            underlyingPrice={underlyingPrice}
            maxProfit={strategyStats.maxProfit}
            maxLoss={strategyStats.maxLoss}
            winRate={strategyStats.profitProbability}
            breakeven={strategyStats.breakeven[0] || 0}
            lotSize={size * 100}
            delta={55.89}
            gamma={3.69}
            theta={-17.2}
            daysToExpiration={daysToExpiration}
          />
        </div>
      </div>
    </div>
  );
}
