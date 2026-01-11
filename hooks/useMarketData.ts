import { useState, useEffect } from "react";
import { MARKETS, type MarketKey } from "@/lib/markets";
import { type Time } from "lightweight-charts";

export const useMarketData = (
  market: MarketKey,
  timeframe: "24h" | "7d" | "30d" = "24h"
) => {
  const [price, setPrice] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<any[]>([]);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const feed = MARKETS[market].pyth.replace("0x", "");

        const res = await fetch(`/api/market/${feed}?tf=${timeframe}`);
        const json = await res.json();

        setPrice(json.price);

        const arr = json.ohlc || [];
        setOhlcData(arr);

        if (arr.length > 1) {
          const open = arr[0].open;
          const close = arr[arr.length - 1].close;

          setPriceChange(((close - open) / open) * 100);
        }

        const cgId = MARKETS[market].coingecko;
        const cgRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );
        const cgData = await cgRes.json();

        if (cgData?.market_data?.fully_diluted_valuation?.usd) {
          setMarketCap(cgData.market_data.fully_diluted_valuation.usd);
        } else if (cgData?.market_data?.market_cap?.usd) {
          setMarketCap(cgData.market_data.market_cap.usd);
        }
      } catch (err) {
        console.error("market data", err);
      }
    };

    load();
    const h = setInterval(load, 30_000);
    return () => clearInterval(h);
  }, [market, timeframe]);

  return { price, ohlcData, priceChange, marketCap };
};
