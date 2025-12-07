import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import ToasterClient from "@/components/ToasterClient";
import { Analytics } from '@vercel/analytics/next';
import MetaPixel from "@/components/MetaPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "adoore - Fashion & Clothing",
  description: "Your one-stop destination for the latest fashion trends and quality clothing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <MetaPixel />
        <AuthProvider>
          <CartProvider>
            <Navigation />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ToasterClient />
            <Analytics />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
