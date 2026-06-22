'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  const handleToastClick = useCallback((toast: ToastData) => {
    router.push('/dashboard');
    dismissToast(toast.id);
  }, [router]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 w-[340px] sm:w-[420px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className="group relative rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-5 slide-up cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-primary/5 hover:translate-y-[-2px] overflow-hidden"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Border accent */}
          <div 
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              toast.type === 'alert' ? 'bg-red-500' : 'bg-primary'
            }`} 
          />

          <div className="flex items-start gap-4 pl-1">
            {toast.icon && <span className="text-xl flex-shrink-0 mt-0.5">{toast.icon}</span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm md:text-base font-bold text-foreground truncate">{toast.title}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation to dashboard when dismissing
                    handleDismiss(toast.id);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-all flex-shrink-0 -mt-1 -mr-1"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                {toast.message}
              </p>
              
              {/* Click instruction hint */}
              <div className="mt-3 flex items-center gap-1 text-[10px] md:text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>Nhấp để xem Dashboard</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Progress bar auto-dismiss indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20 overflow-hidden">
            <div
              className={`h-full ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'warning' ? 'bg-amber-500' :
                toast.type === 'alert' ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ animation: 'toast-progress 5s linear forwards' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
