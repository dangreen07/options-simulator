/**
 * Option pricing and payoff calculations
 */

// Option pricing calculations without external dependencies for now

export interface OptionLeg {
  type: 'call' | 'put';
  action: 'buy' | 'sell';
  strike: number;
  premium: number;
  quantity: number;
}

export interface Strategy {
  name: string;
  legs: OptionLeg[];
}

/**
 * Calculate payoff for a single option leg at expiration
 */
export function calculateLegPayoff(leg: OptionLeg, underlyingPrice: number): number {
  const { type, action, strike, premium, quantity } = leg;
  
  let intrinsicValue = 0;
  if (type === 'call') {
    intrinsicValue = Math.max(0, underlyingPrice - strike);
  } else {
    intrinsicValue = Math.max(0, strike - underlyingPrice);
  }
  
  const multiplier = action === 'buy' ? 1 : -1;
  const premiumCost = action === 'buy' ? -premium : premium;
  
  return (intrinsicValue * multiplier + premiumCost) * quantity * 100; // 100 shares per contract
}

/**
 * Calculate total strategy payoff at expiration
 */
export function calculateStrategyPayoff(strategy: Strategy, underlyingPrice: number): number {
  return strategy.legs.reduce((total, leg) => {
    return total + calculateLegPayoff(leg, underlyingPrice);
  }, 0);
}

/**
 * Generate payoff data for charting
 */
export function generatePayoffData(
  strategy: Strategy,
  currentPrice: number,
  priceRange: number = 0.15
): Array<{ price: number; payoff: number; delta: number; gamma: number; theta: number; vega: number }> {
  const data = [];
  const range = currentPrice * priceRange;
  const start = currentPrice - range;
  const end = currentPrice + range;
  const steps = 200;
  const stepSize = (end - start) / steps;

  for (let i = 0; i <= steps; i++) {
    const price = start + (i * stepSize);
    const payoff = calculateStrategyPayoff(strategy, price);
    
    // Calculate Greeks with proper parameters
    const delta = calculateDelta(strategy, price, currentPrice);
    const gamma = calculateGamma(strategy, price, currentPrice);
    const theta = calculateTheta(strategy, price, currentPrice, 30);
    const vega = calculateVega(strategy, price, currentPrice, 30);
    
    data.push({
      price,
      payoff,
      delta,
      gamma,
      theta,
      vega
    });
  }
  
  return data;
}

/**
 * Calculate Delta - rate of change of option price with respect to underlying price
 * For long calls: Delta approaches 1 as option goes ITM, 0 as it goes OTM
 * For long puts: Delta approaches -1 as option goes ITM, 0 as it goes OTM
 */
function calculateDelta(strategy: Strategy, price: number, currentPrice: number): number {
  let totalDelta = 0;
  
  for (const leg of strategy.legs) {
    const moneyness = price / leg.strike;
    let legDelta = 0;
    
    if (leg.type === 'call') {
      // Call delta: 0 to 1, sigmoid function centered at strike
      const x = (price - leg.strike) / (currentPrice * 0.1); // Normalize
      legDelta = 1 / (1 + Math.exp(-x)); // Sigmoid: 0 to 1
    } else {
      // Put delta: -1 to 0, inverse sigmoid
      const x = (price - leg.strike) / (currentPrice * 0.1);
      legDelta = -1 / (1 + Math.exp(x)); // Sigmoid: -1 to 0
    }
    
    // Apply action multiplier and quantity
    const multiplier = leg.action === 'buy' ? 1 : -1;
    totalDelta += legDelta * multiplier * leg.quantity;
  }
  
  return totalDelta;
}

/**
 * Calculate Gamma - rate of change of Delta with respect to underlying price
 * Gamma is highest ATM and decreases as options go ITM or OTM
 */
function calculateGamma(strategy: Strategy, price: number, currentPrice: number): number {
  let totalGamma = 0;
  
  for (const leg of strategy.legs) {
    // Gamma peaks at strike price for both calls and puts
    const distanceFromStrike = Math.abs(price - leg.strike);
    const normalizedDistance = distanceFromStrike / (currentPrice * 0.1);
    
    // Gaussian distribution centered at strike
    const legGamma = Math.exp(-Math.pow(normalizedDistance, 2)) * 0.02; // Scale factor
    
    // Apply action multiplier and quantity
    const multiplier = leg.action === 'buy' ? 1 : -1;
    totalGamma += legGamma * multiplier * leg.quantity;
  }
  
  return totalGamma;
}

/**
 * Calculate Theta - time decay of option value
 * Theta is negative for long options (lose value over time)
 * Theta is positive for short options (gain value as time passes)
 */
function calculateTheta(strategy: Strategy, price: number, currentPrice: number, daysToExpiration: number = 30): number {
  let totalTheta = 0;
  
  for (const leg of strategy.legs) {
    // Time decay accelerates as expiration approaches
    const timeEffect = Math.sqrt(daysToExpiration / 30); // Scale by time remaining
    
    // ATM options have highest time decay
    const distanceFromStrike = Math.abs(price - leg.strike);
    const atmFactor = Math.exp(-Math.pow(distanceFromStrike / currentPrice, 2) * 2);
    
    // Base theta value (negative for time decay)
    const baseTheta = -leg.premium * 0.03 * atmFactor * timeEffect; // 3% daily decay at ATM
    
    // Apply action multiplier and quantity
    const multiplier = leg.action === 'buy' ? 1 : -1; // Long options lose, short options gain
    totalTheta += baseTheta * multiplier * leg.quantity;
  }
  
  return totalTheta;
}

/**
 * Calculate Vega - sensitivity to changes in implied volatility
 * Vega is highest for ATM options and decreases for ITM/OTM options
 * Vega is positive for long options, negative for short options
 */
function calculateVega(strategy: Strategy, price: number, currentPrice: number, daysToExpiration: number = 30): number {
  let totalVega = 0;
  
  for (const leg of strategy.legs) {
    // Vega is highest at ATM and decreases as options move ITM/OTM
    const distanceFromStrike = Math.abs(price - leg.strike);
    const atmFactor = Math.exp(-Math.pow(distanceFromStrike / currentPrice, 2) * 3);
    
    // Time effect - longer time to expiration = higher vega
    const timeEffect = Math.sqrt(daysToExpiration / 30);
    
    // Base vega (per 1% change in IV)
    const baseVega = leg.premium * 0.15 * atmFactor * timeEffect; // 15% of premium per vol point
    
    // Apply action multiplier and quantity
    const multiplier = leg.action === 'buy' ? 1 : -1; // Long = positive vega, short = negative vega
    totalVega += baseVega * multiplier * leg.quantity;
  }
  
  return totalVega;
}

/**
 * Create predefined strategies
 */
export function createLongCallStrategy(strike: number, currentPrice: number, daysToExpiration: number = 30, premium?: number): Strategy {
  const defaultPremium = premium || calculateRealisticPremium('call', strike, currentPrice, daysToExpiration);
  
  return {
    name: 'Long Call',
    legs: [{
      type: 'call',
      action: 'buy',
      strike,
      premium: defaultPremium,
      quantity: 1
    }]
  };
}

export function createBullCallSpreadStrategy(longStrike: number, shortStrike: number, currentPrice: number, daysToExpiration: number = 30): Strategy {
  const longPremium = calculateRealisticPremium('call', longStrike, currentPrice, daysToExpiration);
  const shortPremium = calculateRealisticPremium('call', shortStrike, currentPrice, daysToExpiration);
  
  return {
    name: 'Bull Call Spread',
    legs: [
      {
        type: 'call',
        action: 'buy',
        strike: longStrike,
        premium: longPremium,
        quantity: 1
      },
      {
        type: 'call',
        action: 'sell',
        strike: shortStrike,
        premium: shortPremium,
        quantity: 1
      }
    ]
  };
}

export function createLongPutStrategy(strike: number, currentPrice: number, daysToExpiration: number = 30, premium?: number): Strategy {
  const defaultPremium = premium || calculateRealisticPremium('put', strike, currentPrice, daysToExpiration);
  
  return {
    name: 'Long Put',
    legs: [{
      type: 'put',
      action: 'buy',
      strike,
      premium: defaultPremium,
      quantity: 1
    }]
  };
}

export function createShortCallStrategy(strike: number, currentPrice: number, daysToExpiration: number = 30, premium?: number): Strategy {
  const defaultPremium = premium || calculateRealisticPremium('call', strike, currentPrice, daysToExpiration);
  
  return {
    name: 'Short Call',
    legs: [{
      type: 'call',
      action: 'sell',
      strike,
      premium: defaultPremium,
      quantity: 1
    }]
  };
}

export function createShortPutStrategy(strike: number, currentPrice: number, daysToExpiration: number = 30, premium?: number): Strategy {
  const defaultPremium = premium || calculateRealisticPremium('put', strike, currentPrice, daysToExpiration);
  
  return {
    name: 'Short Put',
    legs: [{
      type: 'put',
      action: 'sell',
      strike,
      premium: defaultPremium,
      quantity: 1
    }]
  };
}

export function createBearCallSpreadStrategy(shortStrike: number, longStrike: number, currentPrice: number, daysToExpiration: number = 30): Strategy {
  const shortPremium = calculateRealisticPremium('call', shortStrike, currentPrice, daysToExpiration);
  const longPremium = calculateRealisticPremium('call', longStrike, currentPrice, daysToExpiration);
  
  return {
    name: 'Bear Call Spread',
    legs: [
      {
        type: 'call',
        action: 'sell',
        strike: shortStrike,
        premium: shortPremium,
        quantity: 1
      },
      {
        type: 'call',
        action: 'buy',
        strike: longStrike,
        premium: longPremium,
        quantity: 1
      }
    ]
  };
}

export function createLongStraddleStrategy(strike: number, currentPrice: number, daysToExpiration: number = 30): Strategy {
  const callPremium = calculateRealisticPremium('call', strike, currentPrice, daysToExpiration);
  const putPremium = calculateRealisticPremium('put', strike, currentPrice, daysToExpiration);
  
  return {
    name: 'Long Straddle',
    legs: [
      {
        type: 'call',
        action: 'buy',
        strike,
        premium: callPremium,
        quantity: 1
      },
      {
        type: 'put',
        action: 'buy',
        strike,
        premium: putPremium,
        quantity: 1
      }
    ]
  };
}

/**
 * Calculate realistic option premium using simplified Black-Scholes approach
 * Based on Option Alpha's teaching on option pricing fundamentals
 */
function calculateRealisticPremium(type: 'call' | 'put', strike: number, currentPrice: number, daysToExpiration: number = 30): number {
  // Intrinsic value calculation
  let intrinsicValue = 0;
  if (type === 'call') {
    intrinsicValue = Math.max(0, currentPrice - strike);
  } else {
    intrinsicValue = Math.max(0, strike - currentPrice);
  }
  
  // Time value calculation (simplified)
  const timeToExpiration = daysToExpiration / 365;
  const volatility = 0.25; // Assume 25% implied volatility
  const riskFreeRate = 0.05; // 5% risk-free rate
  
  // Distance from ATM (moneyness factor)
  const moneyness = Math.abs(currentPrice - strike) / currentPrice;
  
  // Time value decreases with distance from ATM and time to expiration
  const atmTimeValue = currentPrice * volatility * Math.sqrt(timeToExpiration) * 0.4;
  const moneynessFactor = Math.exp(-Math.pow(moneyness * 5, 2)); // Gaussian decay
  const timeValue = atmTimeValue * moneynessFactor;
  
  // Total premium is intrinsic + time value
  const totalPremium = intrinsicValue + timeValue;
  
  // Minimum bid-ask spread consideration
  return Math.max(0.05, totalPremium);
}

/**
 * Calculate strategy statistics
 */
export function calculateStrategyStats(strategy: Strategy, currentPrice: number): {
  maxProfit: number;
  maxLoss: number;
  breakeven: number[];
  profitProbability: number;
} {
  const data = generatePayoffData(strategy, currentPrice);
  
  const payoffs = data.map(d => d.payoff);
  const maxProfit = Math.max(...payoffs);
  const maxLoss = Math.min(...payoffs);
  
  // Find breakeven points (where payoff crosses zero)
  const breakevens: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    if ((prev.payoff <= 0 && curr.payoff > 0) || (prev.payoff > 0 && curr.payoff <= 0)) {
      // Linear interpolation to find exact breakeven
      const ratio = Math.abs(prev.payoff) / (Math.abs(prev.payoff) + Math.abs(curr.payoff));
      const breakeven = prev.price + ratio * (curr.price - prev.price);
      breakevens.push(breakeven);
    }
  }
  
  // Calculate profit probability (simplified)
  const profitablePoints = payoffs.filter(p => p > 0).length;
  const profitProbability = (profitablePoints / payoffs.length) * 100;
  
  return {
    maxProfit: maxProfit === -Infinity ? Infinity : maxProfit,
    maxLoss: maxLoss === Infinity ? -Infinity : maxLoss,
    breakeven: breakevens,
    profitProbability
  };
}