import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "FinPilot — Thị trường tài chính thông minh",
  description: "Theo dõi cổ phiếu, ETF, crypto, forex với AI Agent thông minh. Dữ liệu thị trường, tin tức, và phân tích kỹ thuật.",
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
