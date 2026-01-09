"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import dynamic from 'next/dynamic';

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Web3ProviderNoSSR>{children}</Web3ProviderNoSSR>
        <Toaster />
      </body>
    </html>
  );
}
