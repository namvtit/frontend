"use client";
import { use } from "react";
import { getMetricBySlug, METRICS } from "@/lib/market/metrics-data";
import { STOCKS } from "@/lib/market/mock-data";
import { formatCurrency, formatLargeNumber } from "@/lib/utils";

export default function MetricDetailPage({ params }: { params: Promise<{ metric: string }> }) {
  const { metric } = use(params);
  const data = getMetricBySlug(metric);

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy chỉ số</h1>
        <a href="/markets" className="btn btn-primary mt-4">Quay lại thị trường</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <a href="/markets" className="text-sm text-primary hover:underline mb-2 inline-block">← Thị trường</a>
        <h1 className="text-2xl font-bold mb-1">{data.nameVi}</h1>
        <p className="text-sm text-muted-foreground">{data.name}</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Giải thích</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
      </div>

      {data.formula && (
        <div className="card bg-primary/5 border-primary/20">
          <h3 className="font-semibold text-sm mb-2">Công thức</h3>
          <p className="font-mono text-sm text-primary">{data.formula}</p>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-sm mb-2">Tại sao chỉ số này quan trọng?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.whyItMatters}</p>
      </div>

      {/* Comparison */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-3">So sánh giữa các mã</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Mã</th><th>Tên</th><th>{data.name}</th></tr></thead>
            <tbody>
              {STOCKS.slice(0, 8).map((s) => {
                let val = "—";
                if (metric === "market-cap") val = formatLargeNumber(s.marketCap);
                else if (metric === "volume") val = formatLargeNumber(s.volume);
                else if (metric === "pe-ratio") val = s.peRatio > 0 ? s.peRatio.toFixed(1) : "—";
                else if (metric === "eps") val = s.eps > 0 ? `$${s.eps.toFixed(2)}` : "—";
                else if (metric === "dividend-yield") val = s.dividendYield > 0 ? `${s.dividendYield.toFixed(2)}%` : "—";
                else if (metric === "beta") val = s.beta.toFixed(2);
                else if (metric === "52-week-high") val = formatCurrency(s.high52w);
                else if (metric === "52-week-low") val = formatCurrency(s.low52w);
                return (
                  <tr key={s.symbol}>
                    <td><a href={`/stocks/${s.symbol}`} className="text-primary font-semibold">{s.symbol}</a></td>
                    <td>{s.name}</td>
                    <td className="font-mono">{val}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related metrics */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-3">Chỉ số liên quan</h3>
        <div className="flex flex-wrap gap-2">
          {data.relatedMetrics.map((slug) => {
            const m = METRICS.find((x) => x.slug === slug);
            return m ? (
              <a key={slug} href={`/metrics/${slug}`} className="badge badge-neutral text-xs hover:text-primary">{m.nameVi}</a>
            ) : null;
          })}
        </div>
      </div>

      {/* Trend chart placeholder */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-3">Biểu đồ xu hướng</h3>
        <div className="skeleton h-40 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-2">Biểu đồ xu hướng sẽ được cập nhật trong phiên bản tiếp theo</p>
      </div>
      </div>
    </div>
  );
}
