'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

import { apiRequest } from '@/lib/api/client';
import { pushToast } from '@/components/ui/toast';

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
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const acceptUser = useCallback((account: { id: string; email: string }) => {
    setUser({ ...account, name: account.email.split('@')[0] });
    setNotifications(INITIAL_NOTIFICATIONS);
  }, []);

  useEffect(() => {
    let active = true;
    // Discard credentials saved by the old demo login.
    try {
      localStorage.removeItem('pisi_auth');
      localStorage.removeItem('pisi_accounts');
    } catch { /* Browser storage may be unavailable. */ }
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load account.');
        if (active) acceptUser(data.user);
      })
      .catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [acceptUser]);

  const authenticate = useCallback(async (action: 'login' | 'register', email: string, password: string) => {
    const data = await apiRequest<{ user: { id: string; email: string } }>(`/api/auth/${action}`, { email, password });
    acceptUser(data.user);
    setError('');
  }, [acceptUser]);
  const login = useCallback((email: string, password: string) => authenticate('login', email, password), [authenticate]);
  const register = useCallback((email: string, password: string) => authenticate('register', email, password), [authenticate]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', {});
      setUser(null);
      setNotifications([]);
      setError('');
    } catch (error) {
      pushToast({ title: 'Đăng xuất thất bại', message: error instanceof Error ? error.message : 'Please try again.', type: 'alert' });
    }
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
      value={{ user, isLoggedIn: !!user, login, register, logout, loading, error, notifications, unreadCount, markAsRead, markAllAsRead, pushNotification }}
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
