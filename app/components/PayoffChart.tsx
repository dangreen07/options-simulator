'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface PayoffChartProps {
  underlyingPrice: number;
  data: Array<{ price: number; payoff: number; delta: number; gamma: number; theta: number; vega: number }>;
  selectedGreek: string;
  breakevens?: number[];
}

// Scale Greek values to be visible alongside P&L values
function scaleGreekData(data: PayoffChartProps['data'], selectedGreek: string) {
  const greekValues = data.map(d => getGreekValue(d, selectedGreek));
  const payoffValues = data.map(d => d.payoff);

  const minGreek = Math.min(...greekValues);
  const maxGreek = Math.max(...greekValues);
  const greekRange = maxGreek - minGreek;
  
  const minPayoff = Math.min(...payoffValues);
  const maxPayoff = Math.max(...payoffValues);
  const payoffRange = maxPayoff - minPayoff;

  // Scale Greeks to fit within a reasonable portion of the payoff range
  const targetRange = payoffRange * 0.3; // Greeks take up 30% of payoff range
  const scaleFactor = greekRange > 0 ? targetRange / greekRange : 1;

  return data.map(d => ({
    ...d,
    scaledGreek: (getGreekValue(d, selectedGreek) - minGreek) * scaleFactor + minPayoff
  }));
}

function getGreekValue(dataPoint: any, selectedGreek: string) {
  switch (selectedGreek.toLowerCase()) {
    case 'delta': return dataPoint.delta;
    case 'gamma': return dataPoint.gamma;
    case 'theta': return dataPoint.theta;
    case 'vega': return dataPoint.vega;
    default: return dataPoint.vega;
  }
}

export default function PayoffChart({ underlyingPrice, data, selectedGreek, breakevens = [] }: PayoffChartProps) {
  // Scale the data for better Greek visualization
  const scaledData = scaleGreekData(data, selectedGreek);

  const getGreekColor = (greek: string) => {
    switch (greek.toLowerCase()) {
      case 'delta': return '#3B82F6'; // Blue
      case 'gamma': return '#8B5CF6'; // Purple  
      case 'theta': return '#EF4444'; // Red
      case 'vega': return '#F59E0B'; // Orange
      default: return '#F59E0B';
    }
  };

  return (
    <div className="flex-1 bg-gray-900 p-4 h-[calc(100vh-20rem)]">
      <div className="h-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scaledData} margin={{ top: 20, right: 40, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="price" 
              stroke="#9CA3AF"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin', 'dataMax']}
              type="number"
              scale="linear"
            />
            <YAxis 
              stroke="#9CA3AF"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#F9FAFB' }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'P&L') {
                  return [`$${value.toFixed(2)}`, name];
                } else if (name.includes('scaled')) {
                  // Show the original Greek value in tooltip
                  const originalValue = getGreekValue(props.payload, selectedGreek);
                  return [originalValue.toFixed(4), selectedGreek];
                }
                return [value.toFixed(2), name];
              }}
            />
            
            {/* Zero line */}
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
            
            {/* Current price line */}
            <ReferenceLine x={underlyingPrice} stroke="#F59E0B" strokeDasharray="2 2" />
            
            {/* Breakeven lines */}
            {breakevens.map((breakeven, index) => (
              <ReferenceLine 
                key={index}
                x={breakeven} 
                stroke="#10B981" 
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ))}
            
            {/* Main payoff curve */}
            <Line 
              type="monotone" 
              dataKey="payoff" 
              stroke="#10B981" 
              strokeWidth={4}
              dot={false}
              name="P&L"
              connectNulls={false}
            />
            
            {/* Selected Greek curve with amplified scale */}
            <Line 
              type="monotone" 
              dataKey="scaledGreek"
              stroke={getGreekColor(selectedGreek)}
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={false}
              name={`${selectedGreek} (scaled)`}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}