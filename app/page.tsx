"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import axios from "axios";
import { createChart, LineSeries, type Time } from "lightweight-charts";

import { PERP_ADDRESS } from "@/lib/contracts";
import PERP_ABI from "@/lib/PerpMarket.json";

/* ---------------- CONFIG ---------------- */

const INIT_MARGIN_RATE = 0.1;
const MAX_LEVERAGE_UI = 10;

/* ---------------- TYPES ---------------- */

type Position = {
  size: bigint;
  entryPrice: bigint;
  margin: bigint;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [price, setPrice] = useState<number | null>(null);
  const [margin, setMargin] = useState("1");
  const [leverage, setLeverage] = useState(3);
  const [loading, setLoading] = useState(false);

  const [position, setPosition] = useState<Position | null>(null);
  const [closePercent, setClosePercent] = useState(100);

  /* ---------------- HELPERS ---------------- */

  const fmt = (v?: bigint, d = 18) => {
    if (typeof v !== "bigint") return 0;
    try {
      return Number(ethers.formatUnits(v, d));
    } catch {
      return 0;
    }
  };

  /* ---------------- DERIVED ---------------- */

  const marginNum = Number(margin) || 0;
  const notional = price ? marginNum * leverage : 0;
  const size = price ? notional / price : 0;

  const canTrade =
    isConnected &&
    price !== null &&
    marginNum > 0 &&
    leverage >= 1 &&
    leverage <= MAX_LEVERAGE_UI &&
    !loading;

  /* ---------------- PRICE ---------------- */

  async function fetchPrice() {
    try {
      const r = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd"
      );
      const p = r.data["tether-gold"].usd;
      console.log("[PERP] PRICE:", p);
      setPrice(p);
    } catch (e) {
      console.error("[PERP] PRICE FAILED", e);
    }
  }

  /* ---------------- POSITION LOAD ---------------- */

  async function loadPosition() {
    if (!address || !publicClient) return;

    try {
      const raw = (await publicClient.readContract({
        address: PERP_ADDRESS as `0x${string}`,
        abi: PERP_ABI.abi,
        functionName: "positions",
        args: [address],
      })) as readonly [bigint, bigint, bigint];

      console.log("[PERP] RAW POSITION:", raw);

      const [size, entryPrice, margin] = raw;

      if (size !== BigInt(0)) {
        setPosition({ size, entryPrice, margin });
      } else {
        setPosition(null);
      }
    } catch (e) {
      console.error("[PERP] LOAD POSITION FAILED", e);
      setPosition(null);
    }
  }


  /* ---------------- OPEN ---------------- */

  async function handleOpen(isLong: boolean) {
    if (!canTrade || !walletClient || !price) return;

    setLoading(true);
    console.group("[PERP] OPEN");

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const perp = new ethers.Contract(PERP_ADDRESS, PERP_ABI.abi, signer);

      const sizeDelta = ethers.parseUnits(size.toFixed(6), 18);
      const marginDelta = ethers.parseEther(margin);

      console.log("sizeDelta:", sizeDelta.toString());
      console.log("marginDelta:", marginDelta.toString());

      await perp.openPosition(isLong, sizeDelta, marginDelta, {
        value: marginDelta,
      });

      await loadPosition();
    } catch (e: any) {
      console.error("[PERP] OPEN FAILED", e?.reason || e);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }

  /* ---------------- CLOSE ---------------- */

  async function handleClose() {
    if (!position || !walletClient) return;

    setLoading(true);
    console.group("[PERP] CLOSE");

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const perp = new ethers.Contract(PERP_ADDRESS, PERP_ABI.abi, signer);

      const absSize = position.size < BigInt(0) ? -position.size : position.size;
      const closeSize = (absSize * BigInt(closePercent)) / BigInt(100);

      console.log("closeSize:", closeSize.toString());

      await perp.closePosition(closeSize);
      await loadPosition();
    } catch (e: any) {
      console.error("[PERP] CLOSE FAILED", e?.reason || e);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }

  /* ---------------- EFFECTS ---------------- */

  // Load price once
  useEffect(() => {
    fetchPrice();
  }, []);

  // Reload position whenever wallet connects / changes
  useEffect(() => {
    if (address && publicClient) {
      loadPosition();
    }
  }, [address, publicClient]);

  /* ---------------- CHART ---------------- */

  useEffect(() => {
    if (!price) return;

    const el = document.getElementById("chart");
    if (!el) return;
    el.innerHTML = "";

    const chart = createChart(el, {
      height: 280,
      layout: {
        background: { color: "#020617" },
        textColor: "#cbd5e1",
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: "#22c55e",
      lineWidth: 2,
    });

    series.setData([
      {
        time: Math.floor(Date.now() / 1000) as Time,
        value: price,
      },
    ]);

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [price]);

  /* ---------------- POSITION METRICS ---------------- */

  const decoded = useMemo(() => {
    if (!position) return null;

    const absSize = fmt(position.size < BigInt(0) ? -position.size : position.size);
    const entry = fmt(position.entryPrice);
    const marginUsd = fmt(position.margin);

    const side = position.size > BigInt(0) ? "LONG" : "SHORT";
    const pnl =
      price !== null
        ? (price - entry) * absSize * (side === "LONG" ? 1 : -1)
        : 0;

    const lev =
      marginUsd > 0 && price !== null
        ? (absSize * price) / marginUsd
        : 0;

    return { side, absSize, entry, marginUsd, pnl, lev };
  }, [position, price]);

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-3xl p-6 space-y-6">

        <header className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">XAUT Perp</h1>
            <p className="text-xs text-slate-400">Mantle Sepolia</p>
          </div>
          <ConnectButton />
        </header>

        <div id="chart" className="border border-slate-800 rounded-xl" />

        {/* Trade */}
        <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <input
            type="number"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="w-full bg-slate-950 px-3 py-2 rounded-md"
            placeholder="Margin (MNT)"
          />

          <input
            type="range"
            min={1}
            max={MAX_LEVERAGE_UI}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
          />

          <div className="text-xs text-slate-400">
            Size: {size.toFixed(6)} XAUT · Notional: ${notional.toFixed(2)}
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleOpen(true)} className="flex-1 bg-emerald-500 text-black py-2 rounded-md">
              Long
            </button>
            <button onClick={() => handleOpen(false)} className="flex-1 bg-rose-500 text-black py-2 rounded-md">
              Short
            </button>
          </div>
        </section>

        {/* Position */}
        {decoded && (
          <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between">
              <div className="font-semibold">{decoded.side}</div>
              <div className={decoded.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                PnL: {decoded.pnl.toFixed(2)} USD
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs text-slate-400 gap-1">
              <div>Entry</div><div>${decoded.entry.toFixed(2)}</div>
              <div>Mark</div><div>${price?.toFixed(2)}</div>
              <div>Margin</div><div>${decoded.marginUsd.toFixed(2)}</div>
              <div>Leverage</div><div>{decoded.lev.toFixed(2)}×</div>
            </div>

            <input
              type="range"
              min={1}
              max={100}
              value={closePercent}
              onChange={(e) => setClosePercent(Number(e.target.value))}
            />

            <button onClick={handleClose} className="w-full bg-rose-500 text-black py-2 rounded-md">
              Close {closePercent}%
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
