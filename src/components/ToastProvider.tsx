'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-right rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-success text-success-foreground'
                : toast.type === 'error'
                  ? 'bg-danger text-danger-foreground'
                  : 'bg-surface text-foreground'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
