"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { TradingChart } from "@/components/TradingChart";
import { Navbar } from "@/components/Navbar";
import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { PositionCard } from "@/components/PositionCard";
import { TradePanel } from "@/components/TradePanel";
import { useMarketData } from "@/hooks/useMarketData";
import { usePosition } from "@/hooks/usePosition";
import { useTrade } from "@/hooks/useTrade";
import { Activity } from "lucide-react";

const MAX_LEVERAGE = 10;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [timeframe, setTimeframe] = useState<"15m" | "30m" | "24h" | "7d">("24h");
  const [activeTab, setActiveTab] = useState<"market" | "positions">("market");
  const [margin, setMargin] = useState("1");
  const [leverage, setLeverage] = useState(3);
  const [closePercent, setClosePercent] = useState(100);

  const { price, priceChange, marketCap, ohlcData } = useMarketData(timeframe);
  const { position, decoded, loadPosition } = usePosition(address, publicClient, price);
  const { loading, openPosition, closePosition } = useTrade(loadPosition);

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
    if (!canTrade || !walletClient || !price) return;
    openPosition(walletClient, true, size, margin);
  };

  const handleOpenShort = () => {
    if (!canTrade || !walletClient || !price) return;
    openPosition(walletClient, false, size, margin);
  };

  const handleClose = () => {
    if (!position || !walletClient) return;
    closePosition(walletClient, position, closePercent);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 mt-10">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h1 className="text-2xl sm:text-2xl font-extrabold tracking-tight lg:text-2xl text-primary">
            Trade Gold <span className="text-muted-foreground">On-Chain</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Perpetual futures for Tether Gold (XAUT). Up to 10x leverage. Zero price impact.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-8 space-y-0">
            <div className="flex items-center gap-2 mb-10">
              <button
                onClick={() => setActiveTab("market")}
                className={`px-4 py-1.5 text-sm font-mono rounded-lg border transition-all ${activeTab === "market"
                    ? "bg-black text-white border-black font-medium shadow-sm"
                    : "bg-white text-muted-foreground border-border/60 hover:border-border hover:text-foreground transition-colors cursor-pointer"
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("positions")}
                className={`px-4 py-1.5 text-sm font-mono rounded-lg border transition-all ${activeTab === "positions"
                    ? "bg-black text-white border-black font-medium shadow-sm"
                    : "bg-white text-muted-foreground border-border/60 hover:border-border hover:text-foreground transition-colors cursor-pointer"
                  }`}
              >
                Position
              </button>
            </div>

            <div className="min-h-[600px]">
              <AnimatePresence mode="wait">
                {activeTab === "market" ? (
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MarketHeader price={price} priceChange={priceChange} marketCap={marketCap} />

                    <div className="mb-8 mt-6">
                      {ohlcData.length > 0 ? (
                        <TradingChart data={ohlcData} />
                      ) : (
                        <div className="h-[350px] flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg">
                          <div className="flex flex-col items-center gap-2">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <span className="text-xs font-mono lowercase">loading data...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center mb-10">
                      <div className="bg-muted/30 p-1 rounded-lg flex items-center gap-1">
                        {(["15m", "30m", "24h", "7d"] as const).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-1.5 rounded-md text-sm font-mono transition-all ${timeframe === tf
                              ? "bg-background shadow-sm text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <MarketStats price={price} priceChange={priceChange} marketCap={marketCap} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="positions"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {decoded ? (
                      <PositionCard
                        decoded={decoded}
                        closePercent={closePercent}
                        setClosePercent={setClosePercent}
                        onClose={handleClose}
                        loading={loading}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Activity className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-lg font-medium">No active positions</p>
                        <p className="text-sm">Open a trade to see it here.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <motion.div variants={itemVariants} className="sticky top-24">
              <TradePanel
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
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
