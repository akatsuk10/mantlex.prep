"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import dynamic from 'next/dynamic';
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const Web3ProviderNoSSR = dynamic(
  () => import('@/lib/Wallet').then((mod) => ({ default: mod.Web3Provider })),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Mantlex.prep - On-Chain Perpetual Futures for Real-World Assets | Trade Gold, BTC, ETH, MNT</title>
        <meta name="description" content="Mantlex.prep is a decentralized perpetual DEX on Mantle. Trade perpetual futures for Gold (XAUT), Bitcoin, Ethereum, and Mantle with up to 10x leverage. Isolated margin, oracle-based pricing, and fully on-chain execution." />
        <meta name="keywords" content="Mantlex.prep, perpetual futures, RWA, real-world assets, XAUT, Tether Gold, Bitcoin, BTC, Ethereum, ETH, Mantle, MNT, leverage trading, on-chain trading, DeFi, perpetual DEX, isolated margin, Pyth oracle" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Avhi & Shivendra" />
        <meta name="theme-color" content="#000000" />

        <meta property="og:title" content="Mantlex.prep - On-Chain Perpetual Futures for Real-World Assets" />
        <meta property="og:description" content="Trade perpetual futures for Gold, BTC, ETH, and MNT with up to 10x leverage on Mantle. Decentralized, isolated margin, fully on-chain." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Mantlex.prep" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mantlex.prep - On-Chain Perpetual Futures for Real-World Assets" />
        <meta name="twitter:description" content="Trade perpetual futures for Gold, BTC, ETH, and MNT with up to 10x leverage on Mantle" />
        <meta name="twitter:creator" content="@avhidotsol" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3ProviderNoSSR>
            {children}
          </Web3ProviderNoSSR>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
