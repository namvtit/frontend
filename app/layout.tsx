import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopNav, MobileNav } from "@/components/layout/TopNav";
import { NewsTicker } from "@/components/market/news-ticker";

export const metadata: Metadata = {
  title: "PISI Markets — Thị trường tài chính thông minh",
  description: "Theo dõi cổ phiếu, ETF, crypto, forex với AI Agent thông minh. Dữ liệu thị trường, tin tức, và phân tích kỹ thuật.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="bg-background" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" style={{ paddingBottom: "4rem" }}>
        <Providers>
          <TopNav />
          <main>{children}</main>
          <div className="fixed bottom-0 left-0 right-0">
            <NewsTicker />
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}

