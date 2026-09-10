"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, TrendingUp, Moon, Sun, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { TickerBanner } from "@/components/market/ticker-banner";
import { useAuth } from "@/lib/auth/auth-context";
import { useDemo } from "@/lib/demo";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-secondary transition-colors"
      aria-label="Toggle theme"
      id="theme-toggle"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Markets", href: "/markets" },
  { name: "News", href: "/news" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "FinPilot", href: "/pisi" },
  { name: "AI Agent", href: "/ai-agent" },
  { name: "Enterprise", href: "/enterprise" },
  { name: "Pricing", href: "/pricing" },
];

/* ── Notification Dropdown ── */
function NotificationDropdown() {
  const { state, dispatch } = useDemo();
  const notifications = state.notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id: string) => dispatch({ type: 'MARK_NOTIF_READ', id });
  const markAllAsRead = () => dispatch({ type: 'MARK_ALL_NOTIF_READ' });
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeColors: Record<string, string> = {
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    alert: 'border-l-red-500',
    info: 'border-l-primary',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-secondary transition-colors"
        aria-label="Notifications"
        id="notification-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="badge badge-demo text-[10px]">{unreadCount} mới</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    router.push('/dashboard');
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-l-2 transition-colors hover:bg-secondary/50 ${typeColors[n.type] || 'border-l-transparent'} ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {n.icon && <span className="text-base flex-shrink-0 mt-0.5">{n.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 bg-muted/20">
            <button
              onClick={() => {
                setOpen(false);
                router.push('/dashboard');
              }}
              className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── User Menu ── */
function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const initials = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
        id="user-menu-btn"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-foreground">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden slide-up">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TopNav ── */
export function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col bg-background/80 backdrop-blur">
      <TickerBanner />
      <nav className="w-full border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden font-bold text-foreground sm:inline">
                Fin<span className="text-primary">Pilot</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Theme + Notifications + Auth */}
            <div className="flex items-center gap-2">

              <ThemeToggle />

              {isLoggedIn ? (
                <>
                  <NotificationDropdown />
                  <UserMenu />
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden px-4 py-2 rounded-lg text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-primary-foreground transition-colors sm:inline-block"
                  id="login-btn"
                >
                  Đăng nhập
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-secondary"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {isLoggedIn ? (
                <div className="pt-2 mt-2 border-t border-border space-y-2">
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: <TrendingUp className="w-5 h-5" /> },
    { href: "/markets", label: "Markets", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h6M9 8h6M17 16h6"/></svg> },
    { href: "/news", label: "News", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg> },
    { href: "/ai-agent", label: "AI", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg> },
    { href: "/pricing", label: "Giá", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ThemeToggle;
