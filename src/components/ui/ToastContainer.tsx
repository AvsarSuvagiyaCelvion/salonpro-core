'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { ToastEventDetail, ToastType } from '@/lib/toast';

interface ToastItem extends ToastEventDetail {
  leaving?: boolean;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(e: Event) {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const newToast: ToastItem = {
        ...customEvent.detail,
        leaving: false,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      // Auto dismiss after exactly 3 seconds
      setTimeout(() => {
        dismissToast(newToast.id);
      }, 3000);
    }

    window.addEventListener('app-toast', handleToast);
    return () => {
      window.removeEventListener('app-toast', handleToast);
    };
  }, []);

  function dismissToast(id: string) {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto transform transition-all duration-250 ease-out flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md border relative overflow-hidden ${
              toast.leaving
                ? 'opacity-0 -translate-y-3 scale-95'
                : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4'
            } ${
              isSuccess
                ? 'bg-[#064E3B] dark:bg-[#064E3B] text-white border-emerald-400/40 shadow-emerald-950/40'
                : isError
                ? 'bg-[#881337] dark:bg-[#881337] text-white border-rose-400/40 shadow-rose-950/40'
                : 'bg-[#10141F] text-white border-[#D4A77F]/50 shadow-black/50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                {isSuccess ? (
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-pulse" />
                  </div>
                ) : isError ? (
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-rose-300 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#D4A77F]" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold tracking-tight leading-snug break-words">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 3-Second Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                className={`h-full ${
                  isSuccess ? 'bg-emerald-300' : isError ? 'bg-rose-300' : 'bg-[#D4A77F]'
                }`}
                style={{
                  animation: 'toast-progress 3s linear forwards',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

