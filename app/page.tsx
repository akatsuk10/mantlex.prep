"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";

import { MARKETS, MarketKey } from "@/lib/markets";
import { TradingChart } from "@/components/TradingChart";
import { Navbar } from "@/components/Navbar";
import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { PositionCard } from "@/components/PositionCard";
import { TradePanel } from "@/components/TradePanel";

import { useMarketData } from "@/hooks/useMarketData";
import { useAllPrices } from "@/hooks/useAllPrices";
import { useAllPositions } from "@/hooks/useAllPositions";
import { useTrade } from "@/hooks/useTrade";

import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Loader2 } from "lucide-react";

const MAX_LEVERAGE = 10;

export default function Home() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [market, setMarket] = useState<MarketKey>("XAUT");
  const [activeTab, setActiveTab] = useState<"market" | "positions">("market");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");

  const [margin, setMargin] = useState("1");
  const [leverage, setLeverage] = useState(3);

  const { price, priceChange, marketCap, ohlcData } = useMarketData(market, timeframe);

  const allPrices = useAllPrices(publicClient);
  const pricesReady = Object.keys(allPrices).length > 0;

  const { positions: allPositions, initialLoad, reload } =
    useAllPositions(address, publicClient, allPrices, activeTab);

  const { loading, openPosition, closePosition } = useTrade(reload);

  const marginNum = Number(margin) || 0;
  const notional = price ? marginNum * leverage : 0;
  const size = price ? notional / price : 0;

  const canTrade =
    isConnected &&
    price !== null &&
    marginNum > 0 &&
    leverage >= 1 &&
    leverage <= MAX_LEVERAGE &&
    !loading;

  const handleOpenLong = () => {
    if (!canTrade || !walletClient) return;
    openPosition(walletClient, MARKETS[market].asset, true, size, margin);
  };

  const handleOpenShort = () => {
    if (!canTrade || !walletClient) return;
    openPosition(walletClient, MARKETS[market].asset, false, size, margin);
  };

  const handleClose = async (asset: `0x${string}`, pct: number, rawSize: bigint) => {
    if (!walletClient) return;
    await closePosition(walletClient, asset, rawSize, pct);
  };

  return (
    <div className="min-h-screen bg-background text-foreground mt-10">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-extrabold text-primary">
            Trade {MARKETS[market].name}
            <span className="text-muted-foreground"> Perpetuals</span>
          </h1>
        </motion.div>

        <div className="flex gap-3">
          {Object.keys(MARKETS).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m as MarketKey)}
              className={`px-3 py-1 rounded-md font-mono border cursor-pointer ${market === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:border-border"
                }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("market")}
                className={`px-4 py-1.5 border rounded-lg text-sm font-mono cursor-pointer ${activeTab === "market" ? "bg-primary text-white dark:text-black" : "text-muted-foreground"
                  }`}
              >
                Market
              </button>

              <button
                onClick={() => setActiveTab("positions")}
                className={`px-4 py-1.5 border rounded-lg text-sm font-mono cursor-pointer ${activeTab === "positions" ? "bg-primary text-white dark:text-black" : "text-muted-foreground"
                  }`}
              >
                Positions
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "market" ? (
                <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <MarketHeader price={price} priceChange={priceChange} marketCap={marketCap} />

                  {ohlcData.length ? (
                    <TradingChart data={ohlcData} />
                  ) : (
                    <div className="h-[350px] flex items-center justify-center border border-dashed rounded-lg">
                      <Skeleton className="w-10 h-10" />
                    </div>
                  )}

                  <div className="flex justify-center gap-2 my-6">
                    {(["24h", "7d", "30d"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 rounded-md text-xs font-mono border cursor-pointer ${
                          timeframe === tf
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground hover:border-border"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <MarketStats
                    price={price}
                    priceChange={priceChange}
                    marketCap={marketCap}
                    market={market}
                  />
                </motion.div>
              ) : (
                <motion.div key="positions">

                  {(!pricesReady || initialLoad) && (
                    <div className="flex flex-col items-center h-[300px] justify-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="mt-4">Loading positions…</p>
                    </div>
                  )}

                  {pricesReady && !initialLoad && allPositions.length === 0 && (
                    <div className="flex flex-col items-center h-[300px] justify-center text-muted-foreground">
                      <Activity className="w-10 h-10 opacity-30" />
                      <p className="mt-4">No open positions</p>
                    </div>
                  )}

                  {pricesReady && !initialLoad && allPositions.length > 0 && (
                    <div className="space-y-6">
                      {allPositions.map((pos, i) => (
                        <PositionCard
                          key={i}
                          marketName={pos.market}
                          asset={pos.asset}
                          decoded={pos.decoded}
                          rawSize={pos.rawSize}
                          onClose={handleClose}
                        />
                      ))}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4">
            <TradePanel
              market={market}
              margin={margin}
              setMargin={setMargin}
              leverage={leverage}
              setLeverage={setLeverage}
              size={size}
              notional={notional}
              price={price}
              canTrade={canTrade}
              isConnected={isConnected}
              loading={loading}
              onOpenLong={handleOpenLong}
              onOpenShort={handleOpenShort}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
