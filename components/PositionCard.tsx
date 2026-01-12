"use client";

import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type PositionCardProps = {
  marketName: string;
  asset: `0x${string}`;
  rawSize: bigint;
  decoded: {
    side: string;
    absSize: number;
    entry: number;
    marginUsd: number;
    pnl: number;
    lev: number;
  };
  onClose: (asset: `0x${string}`, pct: number, rawSize: bigint) => Promise<void>;
};

export const PositionCard = ({
  marketName,
  asset,
  rawSize,
  decoded,
  onClose,
}: PositionCardProps) => {
  const [closePercent, setClosePercent] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleCloseClick = async () => {
    setLoading(true);
    await onClose(asset, closePercent, rawSize);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">{marketName}</h3>
              <Badge variant={decoded.side === "Long" ? "default" : "destructive"} className="text-[10px] px-1.5 h-5">
                {decoded.side} {decoded.lev.toFixed(1)}x
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {decoded.absSize.toFixed(4)} {marketName}
            </p>
          </div>

          <div className="text-right">
            <p
              className={`font-bold text-sm ${decoded.pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
            >
              {decoded.pnl >= 0 ? "+" : ""}
              {decoded.pnl.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">USD</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-dashed bg-muted/30 -mx-4 px-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry Price</p>
            <p className="text-sm font-mono font-medium">${decoded.entry.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin</p>
            <p className="text-sm font-mono font-medium">${decoded.marginUsd.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Close Amount</span>
            <span className="font-mono font-bold">{closePercent}%</span>
          </div>

          <Slider
            max={100}
            min={1}
            step={1}
            value={[closePercent]}
            onValueChange={(vals) => setClosePercent(vals[0])}
            className="py-1"
          />

          <Button
            size="sm"
            variant="secondary"
            className="w-full h-9 transition-colors cursor-pointer"
            onClick={handleCloseClick}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Confirming...</span>
            ) : (
              "Close Position"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
