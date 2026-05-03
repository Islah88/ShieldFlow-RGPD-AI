import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ShieldFlow — Conformité RGPD Automatisée",
  description:
    "Plateforme IA de conformité RGPD automatisée pour PME françaises. Scannez, classifiez et protégez vos données personnelles.",
  keywords: ["RGPD", "conformité", "IA", "données personnelles", "PME", "CNIL"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
