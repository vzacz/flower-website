import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LA FRUTA - Fruit Invoice Website",
  description: "A polished fruit invoice workspace for LA FRUTA customers, orders, and deliveries.",
  // No `icons` here on purpose: src/app/icon.png is picked up automatically and
  // pointing at the deleted favicon.ico would 404.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
