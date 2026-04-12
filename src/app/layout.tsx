import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import CairoFontVerifier from "@/components/CairoFontVerifier";
import FXIBackground from "@/components/FXIBackground";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  weight: ["400", "700", "900"],
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FXI",
  description: "FXI portfolio website for technology, software solutions, and innovation services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.className} ${cairo.variable} min-h-screen text-slate-900 antialiased`}
      >
        <CairoFontVerifier />
        <FXIBackground />
        {children}
      </body>
    </html>
  );
}
