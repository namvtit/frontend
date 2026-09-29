"use client";

import Link from "next/link";
import { BriefcaseBusiness, ChartNoAxesCombined, House, Newspaper, ReceiptText } from "lucide-react";

const items = [
  { href: "/pwa", label: "Home", icon: House, active: true },
  { href: "/markets", label: "Markets", icon: ChartNoAxesCombined },
  { href: "/dashboard", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/dashboard", label: "Orders", icon: ReceiptText },
  { href: "/news", label: "News", icon: Newspaper },
];

export function PwaBottomNav() {
  return (
    <nav className="pwa-bottom-nav" aria-label="Điều hướng FinPilot Mobile">
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link key={label} href={href} className={`pwa-nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
