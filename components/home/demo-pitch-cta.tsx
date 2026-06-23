'use client';

import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';

export function DemoPitchCTA() {
  return (
    <Link
      href="/demo/pitch"
      className="group block rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 p-4 sm:p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
              Interactive Demo
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors mb-1">
            Try the PISI Investment Simulation
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            See how PISI adapts recommendations based on portfolio risk and user preferences.
          </p>
        </div>
        <div className="shrink-0 self-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}
