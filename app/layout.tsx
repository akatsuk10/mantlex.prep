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
        <title>XAUT.perp - Trade Gold On-Chain | Perpetual Futures with 10x Leverage</title>
        <meta name="description" content="Trade Tether Gold (XAUT) perpetual futures on Mantle. Up to 10x leverage with zero price impact. Decentralized on-chain trading platform." />
        <meta name="keywords" content="XAUT, Tether Gold, perpetual futures, crypto trading, leverage trading, on-chain trading, DeFi, Mantle, gold trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="XAUT.perp - Trade Gold On-Chain" />
        <meta property="og:description" content="Trade Tether Gold perpetual futures with up to 10x leverage. Zero price impact trading." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="XAUT.perp - Trade Gold On-Chain" />
        <meta name="twitter:description" content="Trade Tether Gold perpetual futures with up to 10x leverage" />
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
