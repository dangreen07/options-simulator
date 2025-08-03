import { NextRequest } from "next/server";
import { getExpirations } from "@/app/utils/marketData";

/**
 * GET /api/expirations/[symbol]
 *
 * Returns the list of available option expiration dates (Unix epoch seconds)
 * for the requested symbol.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const expirations = await getExpirations(symbol);

    return Response.json(expirations, {
      headers: {
        // Cache API responses at the edge (Vercel) for 30 min.
        "Cache-Control": "s-maxage=1800, stale-while-revalidate",
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
