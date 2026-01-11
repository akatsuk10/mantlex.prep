
import { NextResponse } from "next/server";

let OHLC_CACHE: Record<string, { timestamp: number; data: any[] }> = {};
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const feed = "0x" + id;

  const url = new URL(req.url);
  const timeframe = url.searchParams.get("tf") || "24h";

  try {

    const feedHex = feed.startsWith("0x") ? feed : `0x${feed}`;

    const latest = await fetch(
      `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedHex}`,
      { cache: "no-store" }
    ).then((r) => r.json());

    const p = latest?.parsed?.[0]?.price;
    if (!p) throw new Error("Pyth price missing");

    const price = Number(p.price) * Math.pow(10, p.expo);


    const cgId = mapPythToCoingecko(feedHex);

    if (!cgId) throw new Error("Unknown market");

    const daysMap: Record<string, number> = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
    };
    const days = daysMap[timeframe] || 1;

    const cacheKey = `${cgId}_${timeframe}`;
    const cached = OHLC_CACHE[cacheKey];
    const now = Date.now();

    let ohlc: any[] = [];

    if (cached && now - cached.timestamp < CACHE_TTL) {
      ohlc = cached.data;
    } else {
      try {
        const cg = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=${days}`,
          { cache: "no-store" }
        ).then((r) => r.json());

        ohlc = cg.map((c: any) => ({
          time: Math.floor(c[0] / 1000),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
        }));

        OHLC_CACHE[cacheKey] = {
          timestamp: now,
          data: ohlc,
        };
      } catch {
        ohlc = cached?.data || fallbackOHLC(price);
      }
    }

    return NextResponse.json({
      price,
      ohlc,
      cached: !!cached,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, ohlc: fallbackOHLC(100) },
      { status: 500 }
    );
  }
}

function mapPythToCoingecko(feed: string) {
  const map: Record<string, string> = {
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43":
      "bitcoin",

    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace":
      "ethereum",

    "0x4e3037c822d852d79af3ac80e35eb420ee3b870dca49f9344a38ef4773fb0585":
      "mantle",

    "0x44465e17d2e9d390e70c999d5a11fda4f092847fcd2e3e5aa089d96c98a30e67":
      "tether-gold",
  };

  return map[feed.toLowerCase()];
}

function fallbackOHLC(base: number) {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: 50 }).map((_, i) => {
    const t = now - (50 - i) * 300; 
    const n = base * (1 + (Math.random() - 0.5) * 0.01);
    return {
      time: t,
      open: n * 0.999,
      high: n * 1.01,
      low: n * 0.99,
      close: n,
    };
  });
}
