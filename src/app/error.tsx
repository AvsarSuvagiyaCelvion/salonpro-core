'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, User, Mail, Phone } from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client-side error details
    console.error('[Application Runtime Error]:', error);
  }, [error]);

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'studiodeskapp@gmail.com';
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col items-center justify-center p-4 sm:p-6 text-center transition-colors duration-250">
      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-1">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-xs text-[#D4A77F]">
            ✂
          </div>
          <span className="font-extrabold text-sm text-[#1F2937] dark:text-white">
            Salon<span className="text-[#D4A77F]">Pro</span>
          </span>
        </Link>
        <div className="scale-90 origin-right">
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-inner">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] max-w-sm mx-auto mb-6 leading-relaxed">
          An unexpected error occurred while processing this page. Your data is safe. Please click try again or return to a safe page.
        </p>

        {error?.digest && (
          <div className="mb-5 px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] font-mono text-[#6B7280] dark:text-[#747D8D] inline-block">
            Error Ref: {error.digest}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#252B3B] text-[#1F2937] dark:text-white border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-bold transition-all active:scale-98"
          >
            <Home className="w-4 h-4 text-[#D4A77F]" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#6B7280] dark:text-[#A0A8B8] flex flex-col items-center gap-1.5">
          <span>Need help? Contact support:</span>
          <div className="flex items-center justify-center gap-4 text-xs font-medium">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-1 hover:text-[#D4A77F] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{supportEmail}</span>
            </a>
            <a
              href={`tel:+91${supportPhone}`}
              className="inline-flex items-center gap-1 hover:text-[#D4A77F] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 {supportPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
