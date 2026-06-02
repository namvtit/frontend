'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col sm:flex-row">
      {/* Left Side - Brand */}
      <div className="hidden sm:flex sm:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10 border-r border-border flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20 mx-auto mb-6">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">StockPro</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Professional stock market analysis and trading insights
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Real-time Data</p>
                <p className="text-sm text-muted-foreground">
                  Live market data and analysis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">AI Analytics</p>
                <p className="text-sm text-muted-foreground">
                  AI-powered market insights
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Portfolio Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Manage your investments
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex sm:w-1/2 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="sm:hidden mb-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">StockPro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                  defaultChecked
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-foreground hover:bg-secondary transition-colors">
              <span className="text-lg">🔵</span>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-foreground hover:bg-secondary transition-colors">
              <span className="text-lg">🦅</span>
              <span className="text-sm font-medium">Apple</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
