"use client";

export default function SentimentBadge({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  const labels = { bullish: "Tích cực", bearish: "Tiêu cực", neutral: "Trung lập" };
  const cls = { bullish: "badge-bull", bearish: "badge-bear", neutral: "badge-neutral" };
  return <span className={`badge ${cls[sentiment]} text-xs`}>{labels[sentiment]}</span>;
}
