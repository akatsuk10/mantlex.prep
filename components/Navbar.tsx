"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TrendingUp } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            XAUT<span className="opacity-50 font-normal">.perp</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </div>
    </nav>
  );
};
