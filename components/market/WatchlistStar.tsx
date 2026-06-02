"use client";
import { useState } from "react";

export default function WatchlistStar({ symbol, initialActive = false }: { symbol: string; initialActive?: boolean }) {
  const [active, setActive] = useState(initialActive);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setActive(!active); }}
      className="p-1 hover:scale-110 transition-transform"
      title={active ? "Xóa khỏi Watchlist" : "Thêm vào Watchlist"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#f59e0b" : "none"} stroke={active ? "#f59e0b" : "var(--text-muted)"} strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  );
}
