'use client';

import { useState } from 'react';

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export default function TopNavigation({ activeTab, onTabChange, symbol, onSymbolChange }: TopNavigationProps) {
  const [inputValue, setInputValue] = useState(symbol);

  const handleSubmit = () => {
    if (inputValue && inputValue !== symbol) {
      onSymbolChange(inputValue.toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-4 h-[5rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-white">Options</h1>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white w-20 text-center"
              placeholder="Symbol"
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white text-sm"
            >
              Go
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            TradeStation
          </div>
        </div>
      </div>
    </div>
  );
}