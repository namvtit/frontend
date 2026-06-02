'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, TrendingUp, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TickerBanner } from './ticker-banner';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <TickerBanner />
      <nav className="sticky top-9 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden font-bold text-foreground sm:inline">
                StockPro
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {[
                { name: 'Home', href: '/' },
                { name: 'Markets', href: '/markets' },
                { name: 'News', href: '/news' },
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'AI Agent', href: '/ai-agent' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Theme & Auth */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-secondary transition-colors"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              <Link
                href="/login"
                className="hidden px-4 py-2 rounded-lg text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-primary-foreground transition-colors sm:inline-block"
              >
                Sign In
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-secondary"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-2">
              {[
                { name: 'Home', href: '/' },
                { name: 'Markets', href: '/markets' },
                { name: 'News', href: '/news' },
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'AI Agent', href: '/ai-agent' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
