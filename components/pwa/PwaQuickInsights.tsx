import { BrainCircuit, CircleAlert, LineChart } from "lucide-react";
import { PWA_INSIGHT_DEMO } from "./demo-data";

const icons = [LineChart, CircleAlert, BrainCircuit];

export function PwaQuickInsights() {
  return (
    <section aria-labelledby="pwa-insights-title">
      <div className="pwa-section-heading">
        <h2 id="pwa-insights-title">Tín hiệu nhanh</h2>
        <span>Demo UI</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {PWA_INSIGHT_DEMO.map((insight, index) => {
          const Icon = icons[index];
          return (
            <article key={insight.id} className={`pwa-insight-card pwa-insight-${insight.tone}`}>
              <Icon className="h-4 w-4" />
              <h3>{insight.title}</h3>
              <p>{insight.detail}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
