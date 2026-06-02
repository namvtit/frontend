'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  icon?: string;
}

/* ── Global toast state ── */
let toastListeners: ((toasts: ToastData[]) => void)[] = [];
let toastQueue: ToastData[] = [];

export function pushToast(toast: Omit<ToastData, 'id'>) {
  const newToast: ToastData = { ...toast, id: `toast_${Date.now()}` };
  toastQueue = [newToast, ...toastQueue].slice(0, 5);
  toastListeners.forEach((fn) => fn([...toastQueue]));

  // Auto-dismiss after 5s
  setTimeout(() => {
    dismissToast(newToast.id);
  }, 5000);
}

export function dismissToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  toastListeners.forEach((fn) => fn([...toastQueue]));
}

/* ── Component ── */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="rounded-lg border border-border bg-card shadow-xl p-4 slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            {toast.icon && <span className="text-lg flex-shrink-0 mt-0.5">{toast.icon}</span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{toast.title}</p>
                <button
                  onClick={() => handleDismiss(toast.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
          </div>
          {/* Progress bar auto-dismiss indicator */}
          <div className="mt-2 w-full h-0.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'warning' ? 'bg-amber-500' :
                toast.type === 'alert' ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{ animation: 'toast-progress 5s linear forwards' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
