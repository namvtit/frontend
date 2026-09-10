// ── App Shell Component ──
// Manages global layout chrome (nav, ticker, footer)
// Conditionally hides on immersive demo routes

'use client';

import { usePathname } from 'next/navigation';
import { TopNav, MobileNav } from './TopNav';
import { NewsTicker } from '@/components/market/news-ticker';

const IMMERSIVE_ROUTES = ['/demo/market-replay'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isImmersive = IMMERSIVE_ROUTES.some(route => pathname.startsWith(route));

  if (isImmersive) {
    // Immersive mode - just render children without any chrome
    return <>{children}</>;
  }

  // Normal mode with global chrome
  return (
    <>
      <TopNav />
      <main className="pb-20 md:pb-12">{children}</main>
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <NewsTicker />
        <MobileNav />
      </div>
    </>
  );
}
