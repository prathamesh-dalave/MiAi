import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MiAi – Explore. Compare. Execute.",
  description:
    "Discover and test AI tools instantly. No login required. Compare chatbots, image generators, code assistants and more — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: 'bg-white/5 border-white/10 text-white backdrop-blur-md' }} />
      </body>
    </html>
  );
}
