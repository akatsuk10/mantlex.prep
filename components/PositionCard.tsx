"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

type PositionCardProps = {
  decoded: {
    side: string;
    absSize: number;
    entry: number;
    marginUsd: number;
    pnl: number;
    lev: number;
  };
  closePercent: number;
  setClosePercent: (value: number) => void;
  onClose: () => void;
  loading: boolean;
};

export const PositionCard = ({
  decoded,
  closePercent,
  setClosePercent,
  onClose,
  loading,
}: PositionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Activity className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">XAUT/USD</h3>
            <Badge
              className={
                decoded.side === "LONG"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 border-0 rounded-md text-xs font-medium mt-1"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 border-0 rounded-md text-xs font-medium mt-1"
              }
            >
              {decoded.side} {decoded.lev.toFixed(1)}x
            </Badge>
          </div>
        </div>

        {/* PnL Display */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Unrealized PnL
          </p>
          <div
            className={`text-2xl font-semibold ${decoded.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
          >
            {decoded.pnl >= 0 ? "+" : ""}
            {decoded.pnl.toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Size</span>
          <span className="text-sm font-medium text-foreground">
            {decoded.absSize.toFixed(4)}{" "}
            <span className="text-muted-foreground">XAUT</span>
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Entry</span>
          <span className="text-sm font-medium text-foreground">
            ${decoded.entry.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Margin</span>
          <span className="text-sm font-medium text-foreground">
            ${decoded.marginUsd.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Close Position Section */}
      <div className="space-y-4 ">
        <div className="flex">
          <span className="text-sm font-medium text-foreground">
            Close Position
          </span>
          <span className="text-sm font-semibold text-foreground ml-2">
            {closePercent}%
          </span>
        </div>

        <Slider
          defaultValue={[100]}
          max={100}
          min={1}
          step={1}
          value={[closePercent]}
          onValueChange={(vals) => setClosePercent(vals[0])}
          className="py-1 w-80 flex justify-center items-center"
        />

        <Button
          variant="outline"
          className="cursor-pointer w-90 h-11 font-medium rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950 dark:hover:text-rose-400 dark:hover:border-rose-900 transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          {loading ? "Closing..." : "Execute Close"}
        </Button>
      </div>
    </motion.div>
  );
};