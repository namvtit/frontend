'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, BarChart3, Shield, Zap, Target } from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered Insights',
    description: 'PISI analyzes market conditions and adapts recommendations based on your portfolio risk profile and preferences.',
  },
  {
    icon: BarChart3,
    title: 'Portfolio Simulation',
    description: 'Experience a full year of market events in 20 seconds. See how PISI adjusts to volatility, trends, and opportunities.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Set your risk tolerance and watch PISI maintain disciplined allocation through bull and bear markets.',
  },
  {
    icon: Zap,
    title: 'Real-Time Adaptation',
    description: 'When market conditions shift, PISI revises its recommendations. Review and approve each decision.',
  },
];

export default function DemoPitchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Market Overview
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Target className="w-4 h-4" />
            Interactive Demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Try the PISI Investment Simulation
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            See how PISI adapts recommendations based on portfolio risk and user preferences.
            Experience a year of market simulation in just 20 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo/market-replay"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Open Interactive Demo
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            How the Simulation Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to Experience PISI?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            No account required. The interactive demo runs directly in your browser.
          </p>
          <Link
            href="/demo/market-replay"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Start Simulation Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is a demonstration. Simulated data does not constitute financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
