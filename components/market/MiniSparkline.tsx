"use client";

export default function MiniSparkline({ data, color = "#10b981", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  const trend = data[data.length - 1] >= data[0];
  const c = trend ? "#10b981" : "#ef4444";

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline points={points} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
