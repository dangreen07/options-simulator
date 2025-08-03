// app/utils/marketData.ts

/**
 * Helper utilities for fetching market data from Yahoo! Finance.
 *
 * These utilities centralise all calls to the `yahoo-finance2` library, making it
 * easier to tweak caching strategies and response shapes in a single place.
 *
 * All functions return plain serialisable objects so that the data can be
 * returned directly from Next.js' Route Handlers (`Response.json`).
 */

import yahooFinance from "yahoo-finance2";

/**
 * Returns the list of available option expiration dates for the given symbol.
 *
 * Dates are returned as **Unix epoch seconds** to match the values used by
 * Yahoo!'s own API.
 *
 * @param symbol - Ticker symbol, e.g. "AAPL" or "NVDA".
 */
export async function getExpirations(symbol: string): Promise<number[]> {
  if (!symbol) {
    throw new Error("`symbol` is required");
  }

  const chain = await yahooFinance.options(symbol, {});
  if (!chain || !Array.isArray(chain.expirationDates)) {
    throw new Error(`Unable to fetch expirations for ${symbol}`);
  }
  return chain.expirationDates.map((d: Date) => Math.floor(d.getTime() / 1000));
}

/**
 * Fetches a full option chain (calls & puts) for the given symbol / expiration.
 *
 * Yahoo! uses **Unix epoch seconds** for expiration, so the same type is used
 * for the `expiration` argument.
 *
 * The return value is trimmed to keep only the fields we actually use on the
 * frontend. Returning the full response would blow up the payload size (>1 MB
 * for some chains).
 *
 * @param symbol - Ticker symbol.
 * @param expiration - Unix epoch seconds representing the desired expiration.
 */
export async function getOptionChain(
  symbol: string,
  expiration: number
): Promise<{
  underlyingPrice: number;
  calls: any[];
  puts: any[];
}> {
  if (!symbol || !expiration) {
    throw new Error("`symbol` and `expiration` are required");
  }

  const chain = await yahooFinance.options(symbol, { date: new Date(expiration * 1000) });

  if (!chain || !chain.options?.length) {
    throw new Error(`No option data for ${symbol} @ ${expiration}`);
  }

  const [data] = chain.options; // only a single expiry returned when `date` specified

  return {
    underlyingPrice:
      // Prefer regular market price; fall back to previous close.
      (chain as any).quote?.regularMarketPrice ?? (chain as any).quote?.regularMarketPreviousClose ?? 0,
    calls: data.calls ?? [],
    puts: data.puts ?? [],
  };
}
