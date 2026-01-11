"use client";

import { ExternalLink } from "lucide-react";
import { MarketKey, MARKETS } from "@/lib/markets";
import { PERP_ADDRESS } from "@/lib/contracts";

type MarketStatsProps = {
  price: number | null;
  priceChange: number | null;
  marketCap: number | null;
  market: MarketKey;
};

export const MarketStats = ({ price, priceChange, marketCap, market }: MarketStatsProps) => {
  const m = MARKETS[market];
  const explorerUrl = `https://sepolia.mantlescan.xyz/address/${PERP_ADDRESS}`;

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center py-3 border-b border-border/40 hover:bg-muted/10 px-2 transition-colors">
        <span className="text-muted-foreground text-sm">Token Ticker</span>
        <span className="font-mono font-medium">{market}</span>
      </div>

      <div className="flex justify-between items-center py-3 border-b border-border/40 hover:bg-muted/10 px-2 transition-colors">
        <span className="text-muted-foreground text-sm">Contract Address</span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-medium flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
        >
          {PERP_ADDRESS.slice(0, 6)}...{PERP_ADDRESS.slice(-4)}
          <span className="text-muted-foreground">
            <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      </div>

      <div className="flex justify-between items-center py-3 border-b border-border/40 hover:bg-muted/10 px-2 transition-colors">
        <span className="text-muted-foreground text-sm">Current Price</span>
        <span
          className={`font-mono font-medium ${
            priceChange && priceChange >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {price ? `$${price.toFixed(2)}` : "..."}{" "}
          <span className="text-xs opacity-80">
            ({priceChange ? `${priceChange >= 0 ? "↑" : "↓"} ${priceChange.toFixed(2)}%` : "..."} 24h)
          </span>
        </span>
      </div>

      <div className="flex justify-between items-center py-3 border-b border-border/40 hover:bg-muted/10 px-2 transition-colors">
        <span className="text-muted-foreground text-sm">FDV</span>
        <span className="font-mono font-medium">
          {marketCap ? `$${(marketCap / 1e6).toFixed(1)}M` : "..."}
        </span>
      </div>
    </div>
  );
};
