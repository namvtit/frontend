'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/* ── Types ── */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  time: string;
  read: boolean;
  icon?: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  pushNotification: (n: Omit<Notification, 'id' | 'read' | 'time'>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* ── Mock notifications ── */
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'NVDA tăng 6.62%',
    message: 'NVIDIA vượt kỳ vọng doanh thu Q1, cổ phiếu tăng mạnh trong phiên.',
    type: 'success',
    time: '2 phút trước',
    read: false,
    icon: '📈',
  },
  {
    id: 'n2',
    title: 'Cảnh báo biến động',
    message: 'Thị trường đang biến động mạnh. VIX tăng 12% trong phiên sáng.',
    type: 'warning',
    time: '15 phút trước',
    read: false,
    icon: '⚠️',
  },
  {
    id: 'n3',
    title: 'Lệnh khớp thành công',
    message: 'Mua 100 cổ phiếu AAPL @ $213.25 đã được khớp thành công.',
    type: 'success',
    time: '1 giờ trước',
    read: false,
    icon: '✅',
  },
  {
    id: 'n4',
    title: 'Fed giữ nguyên lãi suất',
    message: 'Lãi suất giữ ở 5.25% – Tín hiệu cắt giảm Q3 đẩy S&P 500 lên đỉnh mới.',
    type: 'info',
    time: '2 giờ trước',
    read: true,
    icon: '🏛️',
  },
  {
    id: 'n5',
    title: 'AI Agent: Phân tích mới',
    message: 'AI Agent đã hoàn thành phân tích danh mục của bạn. Xem kết quả ngay.',
    type: 'info',
    time: '3 giờ trước',
    read: true,
    icon: '🤖',
  },
];

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('pisi_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setNotifications(parsed.notifications || INITIAL_NOTIFICATIONS);
      }
      // Seed demo account for first-time visitors
      const accounts = localStorage.getItem('pisi_accounts');
      if (!accounts) {
        localStorage.setItem('pisi_accounts', JSON.stringify([
          {
            name: 'Demo User',
            email: 'demo@finpilot.com',
            passwordHash: btoa('demo1234'),
            createdAt: new Date().toISOString(),
            isDemo: true,
          },
        ]));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!mounted) return;
    if (user) {
      localStorage.setItem('pisi_auth', JSON.stringify({ user, notifications }));
    } else {
      localStorage.removeItem('pisi_auth');
    }
  }, [user, notifications, mounted]);

  const login = useCallback(async (email: string, _password: string) => {
    // Mock delay
    await new Promise((r) => setTimeout(r, 800));
    const name = email.split('@')[0];
    setUser({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
    });
    setNotifications(INITIAL_NOTIFICATIONS);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const pushNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'time'>) => {
    const newNotif: Notification = {
      ...n,
      id: `n_${Date.now()}`,
      read: false,
      time: 'Vừa xong',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, login, logout, notifications, unreadCount, markAsRead, markAllAsRead, pushNotification }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
