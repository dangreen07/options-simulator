'use client';

import { useState, useEffect } from 'react';

// Removed hardcoded strike generation - now using real market data

interface StrategyControlsProps {
  symbol: string;
  onExpirationChange: (exp: number) => void;
  onStrikeChange: (strike: number) => void;
  onSizeChange: (size: number) => void;
  onGreekChange: (greek: string) => void;
  selectedGreek: string;
  strike: number;
  size: number;
  underlyingPrice: number;
}

function ExpirationSelect({ symbol, onSelect }: { symbol: string; onSelect: (exp: number) => void }) {
  const [expirations, setExpirations] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedSymbol, setLastFetchedSymbol] = useState<string>('');

  // Debounced effect to avoid rapid API calls
  useEffect(() => {
    if (!symbol || symbol.length < 1 || symbol === lastFetchedSymbol) return;
    
    const timeoutId = setTimeout(() => {
      setLoading(true);
      fetch(`/api/expirations/${symbol}`)
        .then(async (res) => {
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Status ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setExpirations(data as number[]);
            setLastFetchedSymbol(symbol);
          } else {
            console.warn('Unexpected expirations payload', data);
            setExpirations([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch expirations for', symbol, ':', err);
          setExpirations([]);
        })
        .finally(() => setLoading(false));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [symbol, lastFetchedSymbol]);

  return (
    <select
      className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
      onChange={(e) => onSelect(Number(e.target.value))}
      disabled={loading}
    >
      <option value="">Expiration</option>
      {expirations.map((exp) => (
        <option key={exp} value={exp}>
          {new Date(exp * 1000).toLocaleDateString()}
        </option>
      ))}
    </select>
  );
}

export default function StrategyControls({ 
  symbol, 
  onExpirationChange, 
  onStrikeChange, 
  onSizeChange, 
  onGreekChange,
  selectedGreek,
  strike,
  size,
  underlyingPrice
}: StrategyControlsProps) {
  const [selectedExpiration, setSelectedExpiration] = useState<number>();
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);
  const [loadingStrikes, setLoadingStrikes] = useState(false);

  // Fetch available strikes when expiration changes
  useEffect(() => {
    if (!symbol || !selectedExpiration) {
      setAvailableStrikes([]);
      return;
    }

    setLoadingStrikes(true);
    fetch(`/api/options/${symbol}/${selectedExpiration}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.calls && Array.isArray(data.calls)) {
          // Extract unique strike prices from the options chain
          const strikeSet = new Set<number>();
          data.calls.forEach((option: any) => {
            if (typeof option.strike === 'number') {
              strikeSet.add(option.strike);
            }
          });
          const strikes = Array.from(strikeSet).sort((a, b) => a - b);
          setAvailableStrikes(strikes);
          
          // Auto-select the closest strike to underlying price on first load OR when strike is 0
          if (strikes.length > 0 && (availableStrikes.length === 0 || strike === 0)) {
            const closestStrike = strikes.reduce((prev: number, curr: number) => 
              Math.abs(curr - underlyingPrice) < Math.abs(prev - underlyingPrice) ? curr : prev
            );
            
            onStrikeChange(closestStrike);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch strikes:', err);
        setAvailableStrikes([]);
      })
      .finally(() => setLoadingStrikes(false));
  }, [symbol, selectedExpiration, strike, underlyingPrice, onStrikeChange]); // Added back necessary dependencies

  const handleExpirationChange = (exp: number) => {
    setSelectedExpiration(exp);
    onExpirationChange(exp);
  };
  return (
    <div className="bg-gray-900 border-b border-gray-700 p-4 h-[4rem]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Expiration</span>
          <ExpirationSelect symbol={symbol} onSelect={handleExpirationChange} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Strike</span>
          <select
            value={strike}
            onChange={(e) => onStrikeChange(parseFloat(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            disabled={loadingStrikes || availableStrikes.length === 0}
          >
            {availableStrikes.length === 0 ? (
              <option value="">Select expiration first</option>
            ) : (
              availableStrikes.map((strikePrice) => (
                <option key={strikePrice} value={strikePrice}>
                  {strikePrice.toFixed(strikePrice % 1 === 0 ? 0 : 1)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Size</span>
          <input
            type="number"
            value={size}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onSizeChange(value);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm w-16"
            min="1"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Greek</span>
          <select 
            value={selectedGreek}
            onChange={(e) => onGreekChange(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
          >
            <option value="Vega">Vega</option>
            <option value="Delta">Delta</option>
            <option value="Gamma">Gamma</option>
            <option value="Theta">Theta</option>
          </select>
        </div>
      </div>
    </div>
  );
}