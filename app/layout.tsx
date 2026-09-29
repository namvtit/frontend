import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "FinPilot — Thị trường tài chính thông minh",
  description: "Theo dõi cổ phiếu, ETF, crypto, forex với AI Agent thông minh. Dữ liệu thị trường, tin tức, và phân tích kỹ thuật.",
  icons: {
    icon: [
      { url: "/icons/finpilot-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-square.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/finpilot-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1b1b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="bg-background" suppressHydrationWarning>
      <body 
        className="min-h-screen font-sans antialiased bg-background text-foreground" 
        suppressHydrationWarning
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
