import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "KisanKart | Direct Fresh Produce Marketplace",
  description: "Public agricultural marketplace for farmers, FPOs, and consumers to buy and sell fresh fruits and vegetables with transparent pricing and direct UPI/payment details.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <AppProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}

