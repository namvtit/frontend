"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, CircleUserRound, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PwaBottomNav } from "./PwaBottomNav";
import { PwaPendingOrders } from "./PwaPendingOrders";
import { PwaPriceChart } from "./PwaPriceChart";
import { PwaQuickInsights } from "./PwaQuickInsights";
import { PwaServiceWorker } from "./PwaServiceWorker";

export function PwaHome() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "nhà đầu tư";

  return (
    <div className="pwa-screen">
      <PwaServiceWorker />
      <div className="pwa-content">
        <header className="flex items-center justify-between px-1 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Chào buổi sáng, {firstName}</p>
            <div className="mt-1 flex items-center gap-2">
              <Image src="/logo-emblem.png" alt="FinPilot Logo" width={28} height={20} className="h-5 w-auto object-contain" priority />
              <span className="text-lg font-extrabold tracking-tight">Fin<span className="text-primary">Pilot</span></span>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Mobile</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pwa/assistant" className="pwa-ai-mark" aria-label="Mở FinPilot AI"><Sparkles className="h-4 w-4" /></Link>
            <button className="pwa-icon-button" aria-label="Thông báo" type="button"><Bell className="h-5 w-5" /></button>
            <span className="pwa-avatar" aria-label="Tài khoản"><CircleUserRound className="h-5 w-5" /></span>
          </div>
        </header>

        <PwaPriceChart />
        <div className="mt-5 space-y-6 pb-26">
          <PwaQuickInsights />
          <PwaPendingOrders />
        </div>
      </div>
      <PwaBottomNav />
    </div>
  );
}
