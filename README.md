# XAUT-Perp

On-chain Perpetual Futures for Real-World Assets (RWAs)

A minimal perpetual trading protocol for tokenized gold (XAUT) built on Mantle Sepolia.  
Trade long or short with leverage using isolated margin, fully on-chain.

---

## What is this?

**XAUT-Perp** is a perpetual DEX that lets users:

- Go long or short on gold (XAUT)
- Choose any leverage
- Trade with any margin amount
- Close partial or full positions
- Get real-time PnL & leverage

All risk checks, margin logic, and liquidations happen **on-chain**.

---

## Features

- 📈 **Long & Short** perpetual positions
- ⚖️ **Isolated margin** system
- 🔁 **Partial / full close**
- 💸 **Trading fees** (protocol-owned)
- 🔥 **Permissionless liquidations**
- 🧠 **Oracle-based pricing**
- ⛓️ **100% on-chain** core logic

---

## Tech Stack

### Smart Contracts
- Solidity ^0.8.19
- OpenZeppelin
- Custom Gold (XAUT) Oracle Adapter using Pyth

### Frontend
- Next.js (App Router)
- wagmi + RainbowKit
- ethers v6
- TailwindCSS
- lightweight-charts

---

## Architecture

```
Frontend (Next.js)
      ↓
PerpMarket.sol
      ↓
GoldOracleAdapter
      ↓
XAUT / Gold Price Feed
```

---

### Core Parameters

| Parameter | Value |
|-----------|-------|
| Initial Margin | 10% |
| Maintenance Margin | 5% |
| Taker Fee | 0.05% |
| Liquidation Reward | 10% |

---

## Status

- ✅ Core perp logic complete
- ✅ Frontend trading live
- ✅ Liquidations enabled
- 🚧 Funding rate (future work)
- 🚧 Multiple markets

---

## Disclaimer

This project is **NOT audited** and is built for:

- Hackathons
- Learning
- Prototyping

**Do not use with real funds.**

---

## Contact

For questions or feedback, open an issue or reach out on Twitter.

Design and Build by [Avhi](https://x.com/avhidotsol) & [Shivendra](https://x.com/shibu0x)

---
