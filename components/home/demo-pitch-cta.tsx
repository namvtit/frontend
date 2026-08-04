import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';

export function DemoPitchCTA() {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-cyan-500/10 p-5 shadow-lg shadow-primary/5 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[.16em] text-primary">GAME GIẢ LẬP THỊ TRƯỜNG 2025</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Bạn sẽ Mua, Giữ hay Bán?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Trải qua 3 tình huống thị trường ngẫu nhiên, đưa ra quyết định và xem danh mục của bạn thay đổi qua từng vòng.</p>
          <div className="mt-4 flex flex-wrap gap-2">{['S&P 500','Nasdaq','Dow Jones'].map(market=><span key={market} className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm font-medium">{market}</span>)}</div>
          <p className="mt-4 text-sm font-semibold text-foreground">30 thử thách · S&P 500 · Nasdaq · Dow Jones</p>
        </div>
        <Link href="/historical-challenge" className="btn btn-primary min-h-12 w-full shrink-0 px-6 text-base focus-visible:ring-2 focus-visible:ring-primary lg:w-auto"><BarChart3 className="h-5 w-5"/>Chơi ngay<ArrowRight className="h-4 w-4"/></Link>
      </div>
    </section>
  );
}
