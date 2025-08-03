import { NextRequest } from "next/server";
import { getOptionChain } from "@/app/utils/marketData";

/**
 * GET /api/options/[symbol]/[exp]
 *
 * Returns the option chain (calls & puts) for the supplied symbol and
 * expiration. `exp` **must** be a Unix epoch timestamp (seconds).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string; exp: string }> }
) {
  try {
    const waitedParams = await params;
    const symbol = waitedParams.symbol.toUpperCase();
    const expiration = Number(waitedParams.exp);

    if (Number.isNaN(expiration)) {
      return Response.json(
        {
          error: "`exp` must be a unix timestamp (seconds)",
        },
        { status: 400 }
      );
    }

    const chain = await getOptionChain(symbol, expiration);

    return Response.json(chain, {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
