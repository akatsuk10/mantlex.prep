# Mantlex.prep

On-chain Perpetual Futures for Real-World Assets

A decentralized perpetual trading protocol supporting multiple markets built on Mantle Sepolia. Trade long or short with leverage using isolated margin, fully on-chain.

## Overview

Mantlex.prep is a perpetual DEX that enables users to:

- Trade perpetual futures on multiple assets (Gold, BTC, ETH, MNT)
- Open long or short positions with custom leverage
- Trade with any margin amount
- Close positions partially or fully
- View real-time PnL and leverage ratios
- Access historical price charts across multiple timeframes

All risk checks, margin logic, and liquidations are executed on-chain with oracle-based pricing.

## Supported Markets

- XAUT (Tether Gold)
- BTC (Bitcoin)
- ETH (Ethereum)
- MNT (Mantle)

## Features

- Long and short perpetual positions
- Isolated margin system
- Partial and full position closing
- Trading fees (protocol-owned)
- Permissionless liquidations
- Pyth oracle-based pricing
- Multi-market support
- Historical price charts (24h, 7d, 30d, 1y)
- Responsive design for mobile and desktop

## Tech Stack

### Smart Contracts
- Solidity ^0.8.19
- OpenZeppelin libraries
- Pyth Oracle Adapter for real-time pricing

### Frontend
- Next.js 14 (App Router)
- TypeScript
- wagmi + viem
- RainbowKit for wallet connection
- TailwindCSS + shadcn/ui
- lightweight-charts for price visualization
- Framer Motion for animations

## Architecture

```
Frontend (Next.js)
      |
      v
PerpMarket.sol
      |
      v
PythOracleAdapter.sol
      |
      v
Pyth Price Feeds
```

## Core Parameters

| Parameter | Value |
|-----------|-------|
| Initial Margin | 10% |
| Maintenance Margin | 5% |
| Taker Fee | 0.05% |
| Liquidation Reward | 10% |

## Deployment

Network: Mantle Sepolia Testnet

Contract Addresses:
- PerpMarket: 0xc9031529D0c8ac5770530f083dC5727a594ab5ec
- PythOracleAdapter: 0x00d2Bd9A1448b86d151D4b9111d8bBd9D00c665A
- Pyth Oracle: 0x98046Bd286715D3B0BC227Dd7a956b83D8978603

## Development Status

- Core perpetual logic implemented
- Multi-market support active
- Frontend trading interface complete
- Liquidation mechanism enabled
- Mobile responsive design implemented
- Price chart visualization with multiple timeframes

Future improvements:
- Funding rate mechanism
- Additional markets
- Advanced order types

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
